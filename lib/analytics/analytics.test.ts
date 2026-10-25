import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import { analyticsPath, batchSchema, referralSource, reportDays, SESSION_COOKIE, type EventBatch } from "./model";
import { writeEvents, writeServerEvent, pruneEvents } from "./store";
import { analyticsReport, reportCsv } from "./report";
import { collectEvents } from "./ingest";
import type { D1Database } from "@/cloudflare-env";
const mf = new Miniflare({ modules: true, script: "export default { fetch() { return new Response('test'); } }", compatibilityDate: "2026-07-25", d1Databases: ["JOB_BOARD"] });
const db = await mf.getD1Database("JOB_BOARD") as unknown as D1Database;
const now = new Date("2026-10-25T16:00:00.000Z");
const sessionId = crypto.randomUUID();
function batch(events: { name: EventBatch["events"][number]["name"]; path?: string; properties?: EventBatch["events"][number]["properties"]; at?: number }[], id = sessionId): EventBatch {
  return { consent: true, sessionId: id, source: "chatgpt", device: "mobile", events: events.map(event => ({ id: crypto.randomUUID(), name: event.name, path: event.path || "/", properties: event.properties || {}, occurredAt: new Date(now.getTime() - 60_000 + (event.at || 0) * 1000).toISOString() })) };
}
before(async () => {
  for (const name of ["0001_job_board", "0004_behavior_analytics"]) {
    const sql = await readFile(new URL(`../../migrations/job-board/${name}.sql`, import.meta.url), "utf8");
    for (const statement of sql.replace(/^--.*$/gm, "").split(";").filter(s => s.trim())) await db.prepare(statement).run();
  }
});
after(async () => { await mf.dispose(); });
beforeEach(async () => { await db.prepare("DELETE FROM analytics_events").run(); });

test("route templates discard queries and private profile identifiers", () => {
  assert.equal(analyticsPath("/jobs?email=private@example.com#token"), "/jobs");
  assert.equal(analyticsPath("/creator-profile/secret-share-id"), "/creator-profile/:id");
  assert.equal(analyticsPath("/jobs/abc/apply?token=secret"), "/jobs/:id/apply");
  for (const path of ["/dashboard/admin", "/api/auth/callback", "/reset-password/secret", "//evil.example", "/unknown"]) assert.equal(analyticsPath(path), null);
  assert.equal(reportDays("900"), 30);
  assert.equal(reportDays("7"), 7);
});
test("referral matching uses hostname boundaries", () => {
  assert.equal(referralSource("https://chatgpt.com/c/private", "https://ugc.community"), "chatgpt");
  assert.equal(referralSource("https://chatgpt.com.evil.example", "https://ugc.community"), "other");
  assert.equal(referralSource("https://ugc.community/jobs?q=private", "https://ugc.community"), "internal");
  assert.equal(referralSource("", "https://ugc.community"), "direct");
});
test("strict event validation rejects private properties and client-forged outcomes", () => {
  assert.equal(batchSchema.safeParse(batch([{ name: "page_view" }])).success, true);
  const payload = batch([{ name: "form_start", properties: { form: "profile" } }]);
  for (const fields of [{ email: "private@example.com" }, { query: "my email" }, { message: "private" }, { userId: "account" }]) {
    assert.equal(batchSchema.safeParse({ ...payload, events: [{ ...payload.events[0], properties: fields }] }).success, false);
  }
  assert.equal(batchSchema.safeParse({ ...payload, events: [{ ...payload.events[0], name: "application_sent" }] }).success, false);
  assert.equal(batchSchema.safeParse({ ...payload, consent: false }).success, false);
  assert.equal(batchSchema.safeParse({ ...payload, events: Array(21).fill(payload.events[0]) }).success, false);
});
test("retries deduplicate, private paths are normalized, and server outcomes deduplicate", async () => {
  const events = batch([{ name: "page_view", path: "/creator-profile/private-share?email=private" }]);
  await writeEvents(db, events, now); await writeEvents(db, events, now);
  await writeServerEvent(db, sessionId, "application_sent", "/jobs/:id/apply", { jobId: "job-1" }, "application-1");
  await writeServerEvent(db, sessionId, "application_sent", "/jobs/:id/apply", { jobId: "job-1" }, "application-1");
  const rows = await db.prepare("SELECT * FROM analytics_events").all<{ path: string }>();
  assert.equal(rows.results.length, 2);
  assert.equal(rows.results[0].path, "/creator-profile/:id");
  assert.doesNotMatch(JSON.stringify(rows.results), /private-share|private@example/);
});
test("funnels require ordered stages and handle out-of-order beacon arrival", async () => {
  await writeEvents(db, batch([{ name: "apply_click", at: 4 }, { name: "job_brief_open", at: 2 }, { name: "page_view", path: "/jobs", at: 0 }]), now);
  await writeEvents(db, batch([{ name: "apply_click", at: 0 }, { name: "page_view", path: "/", at: 1 }, { name: "job_brief_open", at: 2 }], crypto.randomUUID()), now);
  await writeEvents(db, batch([{ name: "page_view", path: "/about" }], crypto.randomUUID()), now);
  const report = await analyticsReport(db, 7, new Date(now.getTime() + 1));
  assert.deepEqual(report.browserFunnel.map(step => step.sessions), [2, 2, 1]);
  assert.equal(report.current.sessions, 3);
  assert.equal(report.current.applyClicks, 2);
  assert.equal(report.sources[0].label, "chatgpt");
  assert.equal(report.sources[0].sessions, 3);
  assert.equal(report.devices[0].label, "mobile");
});
test("reports separate browser traffic from server outcomes and compare prior windows", async () => {
  await writeEvents(db, batch([{ name: "page_view" }, { name: "page_engagement", properties: { seconds: 15 } }]), now);
  await writeEvents(db, batch([{ name: "page_view" }], crypto.randomUUID()), new Date(now.getTime() - 9 * 86400_000));
  await writeServerEvent(db, crypto.randomUUID(), "application_sent", "/jobs/:id/apply", { jobId: "job-1" }, "send-1");
  // Make the server outcome deterministic for the report's clock.
  await db.prepare("UPDATE analytics_events SET received_at=? WHERE origin='server'").bind(new Date(now.getTime() - 1).toISOString()).run();
  const report = await analyticsReport(db, 7, new Date(now.getTime() + 1));
  assert.equal(report.current.sessions, 1); assert.equal(report.current.pageviews, 1);
  assert.equal(report.current.sent, 1); assert.equal(report.current.engaged, 1); assert.equal(report.current.seconds, 15);
  assert.equal(report.previous.sessions, 1);
  assert.equal(report.daily.length, 8);
  assert.equal(report.daily.reduce((sum, day) => sum + day.pageviews, 0), 1);
  assert.equal(report.jobs[0].sent, 1);
  assert.equal(report.sources.reduce((sum, row) => sum + row.sessions, 0), 1);
  assert.equal(reportCsv(report).startsWith('"Section","Label","Events","Sessions"'), true);
  const malicious = { ...report, pages: [{ label: '=IMPORTDATA("evil")', events: 1, sessions: 1 }] };
  assert.match(reportCsv(malicious), /'=/);
});
test("retention deletes expired events and keeps the boundary", async () => {
  await writeEvents(db, batch([{ name: "page_view" }]), new Date(now.getTime() - 91 * 86400_000));
  await writeEvents(db, batch([{ name: "page_view" }]), new Date(now.getTime() - 90 * 86400_000));
  await pruneEvents(db, now);
  assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM analytics_events").first<{ n: number }>())?.n, 1);
});
function request(payload: unknown, headers: Record<string, string> = {}) {
  return new Request("https://ugc.community/api/analytics/events", { method: "POST", headers: { origin: "https://ugc.community", "content-type": "application/json", cookie: `${SESSION_COOKIE}=${sessionId}`, "cf-connecting-ip": "192.0.2.1", ...headers }, body: JSON.stringify(payload) });
}
const bindings = async () => ({ JOB_BOARD: db, PUBLIC_API_RATE_LIMITER: { limit: async () => ({ success: true }) } });
test("collector enforces origin, consent cookie, privacy signals, and payload size", async () => {
  const payload = batch([{ name: "page_view" }]);
  assert.equal((await collectEvents(request(payload), bindings)).status, 204);
  assert.equal((await collectEvents(request(payload, { origin: "https://evil.example" }), bindings)).status, 403);
  assert.equal((await collectEvents(request(payload, { origin: "" }), bindings)).status, 403);
  assert.equal((await collectEvents(request(payload, { cookie: "" }), bindings)).status, 403);
  assert.equal((await collectEvents(request(payload, { "sec-fetch-site": "cross-site" }), bindings)).status, 403);
  let calls = 0;
  const noBinding = async () => { calls++; throw new Error("must not read db"); };
  for (const headers of ([{ dnt: "1" }, { "sec-gpc": "1" }, { "user-agent": "Googlebot" }] as Record<string, string>[])) assert.equal((await collectEvents(request(payload, headers), noBinding)).status, 204);
  assert.equal(calls, 0);
  assert.equal((await collectEvents(request({ padding: "x".repeat(25000) }), bindings)).status, 400);
});
test("collector rate limits and fails closed without production protections", async () => {
  const payload = batch([{ name: "page_view" }]);
  const limited = await collectEvents(request(payload), async () => ({ JOB_BOARD: db, PUBLIC_API_RATE_LIMITER: { limit: async () => ({ success: false }) } }));
  assert.equal(limited.status, 429); assert.equal(limited.headers.get("retry-after"), "60");
  assert.equal((await collectEvents(request(payload), async () => ({ JOB_BOARD: db }))).status, 503);
  assert.equal((await collectEvents(request(payload), async () => { throw new Error("secret"); })).status, 503);
  assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM analytics_events").first<{ n: number }>())?.n, 0);
});
test("impression ingestion requires a public job identifier and rejects private properties", async () => {
  const valid = batch([{ name: "job_impression", properties: { jobId: "job-public-id" } }]);
  assert.equal(batchSchema.safeParse(valid).success, true);
  assert.equal(batchSchema.safeParse(batch([{ name: "job_impression" }])).success, false);
  assert.equal((await collectEvents(request(valid), bindings)).status, 204);
  const invalid = { ...valid, events: [{ ...valid.events[0], properties: { jobId: "job-public-id", email: "private@example.com" } }] };
  assert.equal((await collectEvents(request(invalid), bindings)).status, 400);
});

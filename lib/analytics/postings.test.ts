import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import type { D1Database } from "@/cloudflare-env";
import { postingReport, postingPage, PostingNotFound } from "./postings";
import { writeEvents, writeServerEvent } from "./store";
import type { EventBatch } from "./model";
const mf = new Miniflare({ modules: true, script: "export default { fetch() { return new Response('test'); } }", compatibilityDate: "2026-07-25", d1Databases: ["JOB_BOARD"] });
const db = await mf.getD1Database("JOB_BOARD") as unknown as D1Database;
const now = new Date("2026-10-25T16:00:00Z"), recent = new Date(now.getTime() - 1000);
before(async () => {
  for (const name of ["0001_job_board", "0002_applications", "0004_behavior_analytics", "0005_posting_analytics_indexes"]) {
    const sql = await readFile(new URL(`../../migrations/job-board/${name}.sql`, import.meta.url), "utf8");
    for (const statement of sql.replace(/^--.*$/gm, "").split(";").filter(s => s.trim())) await db.prepare(statement).run();
  }
});
after(async () => { await mf.dispose(); });
async function job(id: string, owner: string | null, status = "published", kind = "direct") {
  await db.prepare(`INSERT INTO board_jobs(id,source_kind,status,company,title,description,submitter_user_id,submitter_email,review_notes,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(id, kind, status, "Test company", `Listing ${id}`, "Private description", owner, "same-contact@example.com", "Private review notes", recent.toISOString(), recent.toISOString()).run();
}
beforeEach(async () => {
  await db.prepare("DELETE FROM analytics_events").run(); await db.prepare("DELETE FROM board_jobs").run();
  await job("alice-job", "alice"); await job("alice-pending", "alice", "pending_review");
  await job("bob-job", "bob"); await job("unclaimed", null); await job("external", "alice", "published", "external");
});
async function activity(jobId: string, names: EventBatch["events"][number]["name"][], at = recent) {
  await writeEvents(db, { consent: true, sessionId: crypto.randomUUID(), source: jobId === "bob-job" ? "social" : "chatgpt", device: "mobile", events: names.map(name => ({ id: crypto.randomUUID(), occurredAt: at.toISOString(), name, path: "/jobs", properties: { jobId } })) }, at);
}
test("owners see only their direct postings, including listings with zero activity", async () => {
  await activity("alice-job", ["job_brief_open", "apply_click"]);
  await activity("bob-job", ["job_brief_open", "apply_click", "apply_click"]);
  await activity("external", ["apply_click"]);
  const report = await postingReport(db, "alice", { days: 7 }, now);
  assert.equal(report.totalJobs, 2); assert.equal(report.current.briefs, 1); assert.equal(report.current.clicks, 1); assert.equal(report.current.sessions, 1);
  assert.deepEqual(report.jobs.map(job => job.id).sort(), ["alice-job", "alice-pending"]);
  assert.equal(report.jobs.find(job => job.id === "alice-pending")?.clicks, 0);
  assert.equal(report.sources[0].label, "chatgpt"); assert.equal(report.sources.length, 1);
  assert.doesNotMatch(JSON.stringify(report), /same-contact|Private review|Private description|bob-job|unclaimed/);
});
test("selected job ownership cannot be bypassed by guessing IDs or sharing a contact email", async () => {
  for (const jobId of ["bob-job", "unclaimed", "external", "missing", "alice-job' OR 1=1 --"]) await assert.rejects(() => postingReport(db, "alice", { jobId }, now), PostingNotFound);
  await assert.rejects(() => postingReport(db, "", {}, now), /Account is required/);
});
test("individual reports exclude other owned jobs and still compare previous periods", async () => {
  await activity("alice-job", ["apply_click"]);
  await activity("alice-pending", ["apply_click", "apply_click"]);
  await activity("alice-job", ["job_brief_open"], new Date(now.getTime() - 9 * 86400_000));
  const report = await postingReport(db, "alice", { jobId: "alice-job", days: 7 }, now);
  assert.equal(report.totalJobs, 1); assert.equal(report.jobs[0].id, "alice-job");
  assert.equal(report.current.clicks, 1); assert.equal(report.previous.briefs, 1);
  assert.equal(report.daily.reduce((sum, row) => sum + row.clicks, 0), 1);
  assert.equal(report.daily.length, 8);
});
test("server outcomes are counted without fabricating browser sessions", async () => {
  await writeServerEvent(db, crypto.randomUUID(), "application_sent", "/jobs/:id/apply", { jobId: "alice-job" }, "send-1");
  await writeServerEvent(db, crypto.randomUUID(), "application_sent", "/jobs/:id/apply", { jobId: "bob-job" }, "send-2");
  await db.prepare("UPDATE analytics_events SET received_at=?").bind(recent.toISOString()).run();
  const report = await postingReport(db, "alice", {}, now);
  assert.equal(report.current.sent, 1); assert.equal(report.current.sessions, 0);
  assert.deepEqual(report.sources, []); assert.deepEqual(report.devices, []);
});
test("pagination is bounded and totals include activity outside the current page", async () => {
  for (let i = 0; i < 23; i++) await job(`extra-${i}`, "alice");
  await activity("alice-job", ["apply_click"]);
  const report = await postingReport(db, "alice", { page: 9000 }, now);
  assert.equal(report.page, 2); assert.equal(report.totalJobs, 25); assert.equal(report.jobs.length, 5); assert.equal(report.current.clicks, 1);
  for (const value of ["bad", -1, Infinity, null]) assert.equal(postingPage(value), 1);
  assert.equal(postingPage(1.9), 1); assert.equal(postingPage(10001), 10000);
});
test("empty accounts get an empty report and invalid periods default safely", async () => {
  const report = await postingReport(db, "no-postings", { days: 999 }, now);
  assert.equal(report.days, 30); assert.equal(report.totalJobs, 0); assert.deepEqual(report.jobs, []); assert.equal(report.current.clicks, 0);
});
test("closed and rejected postings retain their owner's historical activity", async () => {
  await job("alice-closed", "alice", "closed"); await job("alice-rejected", "alice", "rejected");
  await activity("alice-closed", ["job_brief_open", "apply_click"]);
  const report = await postingReport(db, "alice", {}, now);
  assert.equal(report.totalJobs, 4);
  assert.equal(report.jobs.find(job => job.id === "alice-closed")?.clicks, 1);
  assert.equal(report.jobs.find(job => job.id === "alice-rejected")?.status, "rejected");
});

async function visitor(sessionId: string, jobId: string, events: { name: EventBatch["events"][number]["name"]; seconds: number }[], received = recent) {
  const batch: EventBatch = { consent: true, sessionId, source: "direct", device: "desktop", events: events.map(event => ({ id: crypto.randomUUID(), name: event.name, path: "/jobs", occurredAt: new Date(now.getTime() + event.seconds * 1000).toISOString(), properties: { jobId } })) };
  await writeEvents(db, batch, received); return batch;
}
test("conversion rates deduplicate views/actions and require a prior view in the same listing session", async () => {
  const converted = crypto.randomUUID();
  const first = await visitor(converted, "alice-job", [{ name: "job_impression", seconds: -60 }, { name: "job_impression", seconds: -59 }, { name: "job_brief_open", seconds: -58 }, { name: "apply_click", seconds: -57 }, { name: "apply_click", seconds: -56 }]);
  await writeEvents(db, first, recent); // Batch replay must not affect counters.
  await visitor(crypto.randomUUID(), "alice-job", [{ name: "job_impression", seconds: -60 }, { name: "job_brief_open", seconds: -58 }]);
  await visitor(crypto.randomUUID(), "alice-job", [{ name: "apply_click", seconds: -61 }, { name: "job_impression", seconds: -60 }]);
  await visitor(crypto.randomUUID(), "alice-job", [{ name: "job_impression", seconds: -60 }]);
  await visitor(crypto.randomUUID(), "alice-job", [{ name: "apply_click", seconds: -40 }]); // No recorded view, e.g. older client.
  await visitor(crypto.randomUUID(), "bob-job", [{ name: "job_impression", seconds: -60 }, { name: "apply_click", seconds: -40 }]);
  await writeServerEvent(db, converted, "application_sent", "/jobs/:id/apply", { jobId: "alice-job" }, "converted-send");
  await writeServerEvent(db, crypto.randomUUID(), "application_sent", "/jobs/:id/apply", { jobId: "alice-job" }, "unattributed-send");
  await db.prepare("UPDATE analytics_events SET received_at=?,occurred_at=? WHERE origin='server'").bind(recent.toISOString(), new Date(now.getTime() - 30_000).toISOString()).run();
  const report = await postingReport(db, "alice", { days: 7 }, now);
  assert.equal(report.current.impressions, 4); assert.equal(report.current.clicks, 4); assert.equal(report.current.sent, 2);
  assert.deepEqual(report.conversions, { impressions: 4, opened: 2, applied: 1, sent: 1, briefRate: 50, applyRate: 25, emailRate: 25 });
  assert.deepEqual(report.jobs.find(job => job.id === "alice-job")?.conversions, report.conversions);
  assert.equal(report.jobs.find(job => job.id === "alice-pending")?.conversions.applyRate, null);
});
test("a view of one posting cannot attribute an application to another posting", async () => {
  const session = crypto.randomUUID();
  await visitor(session, "alice-job", [{ name: "job_impression", seconds: -60 }]);
  await visitor(session, "alice-pending", [{ name: "apply_click", seconds: -40 }]);
  const report = await postingReport(db, "alice", {}, now);
  assert.equal(report.conversions.impressions, 1); assert.equal(report.conversions.applied, 0); assert.equal(report.conversions.applyRate, 0);
  const other = await postingReport(db, "alice", { jobId: "alice-pending" }, now);
  assert.equal(other.current.clicks, 1); assert.equal(other.conversions.applyRate, null);
});
test("overall conversion is weighted by listing opportunities, not an average of percentages", async () => {
  for (let i = 0; i < 3; i++) await visitor(crypto.randomUUID(), "alice-job", [{ name: "job_impression", seconds: -60 }]);
  await visitor(crypto.randomUUID(), "alice-pending", [{ name: "job_impression", seconds: -60 }, { name: "apply_click", seconds: -40 }]);
  const report = await postingReport(db, "alice", {}, now);
  assert.equal(report.conversions.applyRate, 25); assert.equal(report.current.impressions, 4);
  assert.equal(report.jobs.find(job => job.id === "alice-pending")?.conversions.applyRate, 100);
});
test("no historical impressions produces unavailable rates, not a fabricated zero baseline", async () => {
  await activity("alice-job", ["apply_click"]);
  const report = await postingReport(db, "alice", {}, now);
  assert.equal(report.current.impressions, 0); assert.equal(report.current.clicks, 1);
  assert.equal(report.conversions.applyRate, null); assert.equal(report.previousConversions.applyRate, null);
});
test("same session can view multiple listings, with one impression per listing across repeat days", async () => {
  const session = crypto.randomUUID();
  await visitor(session, "alice-job", [{ name: "job_impression", seconds: -60 }]);
  await visitor(session, "alice-pending", [{ name: "job_impression", seconds: -60 }, { name: "apply_click", seconds: -40 }]);
  await visitor(session, "alice-job", [{ name: "job_impression", seconds: -86460 }], new Date(now.getTime() - 86400_000));
  const report = await postingReport(db, "alice", {}, now);
  assert.equal(report.current.impressions, 2); assert.equal(report.conversions.impressions, 2); assert.equal(report.conversions.applyRate, 50);
  assert.equal(report.current.sessions, 1); assert.equal(report.daily.reduce((sum, day) => sum + day.impressions, 0), 3);
});
test("prior-period conversion cohorts are separate from the current window", async () => {
  const prior = new Date(now.getTime() - 9 * 86400_000), session = crypto.randomUUID();
  await writeEvents(db, { consent: true, sessionId: session, source: "direct", device: "desktop", events: ["job_impression", "apply_click"].map((name, i) => ({ id: crypto.randomUUID(), name: name as "job_impression" | "apply_click", path: "/jobs", occurredAt: new Date(prior.getTime() - 2000 + i * 1000).toISOString(), properties: { jobId: "alice-job" } })) }, prior);
  const report = await postingReport(db, "alice", { days: 7 }, now);
  assert.equal(report.previousConversions.applyRate, 100); assert.equal(report.conversions.applyRate, null);
});

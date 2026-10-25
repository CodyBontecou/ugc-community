import test from "node:test";
import assert from "node:assert/strict";
import { analyticsPath, referralSource } from "./model";

test("published tutorial landings are measurable without accepting private or unknown paths", () => {
  assert.equal(analyticsPath("/tutorials"), "/tutorials");
  assert.equal(analyticsPath("/tutorials/find-paid-ugc-jobs?email=private@example.com#secret"), "/tutorials/find-paid-ugc-jobs");
  assert.equal(analyticsPath("/tutorials/private-contact-details"), null);
  assert.equal(analyticsPath("/tutorials/find-paid-ugc-jobs/content.md"), null);
});

test("recognized AI campaign sources survive missing referrers without storing query values", () => {
  assert.equal(referralSource("", "https://ugc.community", "https://ugc.community/jobs?utm_source=chatgpt.com"), "chatgpt");
  assert.equal(referralSource("", "https://ugc.community", "https://ugc.community/jobs?utm_source=perplexity"), "perplexity");
  assert.equal(referralSource("", "https://ugc.community", "https://ugc.community/jobs?utm_source=claude.ai"), "claude");
  assert.equal(referralSource("", "https://ugc.community", "https://ugc.community/jobs?utm_source=chatgpt.com.evil.example"), "direct");
  assert.equal(referralSource("", "https://ugc.community", "https://evil.example/?utm_source=chatgpt.com"), "direct");
  assert.equal(referralSource("https://perplexity.ai/search/private", "https://ugc.community", "https://ugc.community/jobs?utm_source=chatgpt.com"), "perplexity");
});

test("AI acquisition deduplicates sessions, preserves entry pages, and separates partial days", async () => {
  const { Miniflare } = await import("miniflare");
  const { readFile } = await import("node:fs/promises");
  const { writeEvents } = await import("./store");
  const { aiAcquisitionReport } = await import("./ai-acquisition");
  const mf = new Miniflare({ modules: true, script: "export default { fetch() { return new Response('test'); } }", compatibilityDate: "2026-07-25", d1Databases: ["JOB_BOARD"] });
  try {
    const db = await mf.getD1Database("JOB_BOARD");
    const sql = await readFile(new URL("../../migrations/job-board/0004_behavior_analytics.sql", import.meta.url), "utf8");
    for (const statement of sql.replace(/^--.*$/gm, "").split(";").filter(s => s.trim())) await db.prepare(statement).run();
    const session = crypto.randomUUID();
    const at = new Date("2026-10-24T12:00:00Z");
    await writeEvents(db, { consent: true, sessionId: session, source: "chatgpt", device: "desktop", events: [
      { id: crypto.randomUUID(), name: "page_view", path: "/tutorials/find-paid-ugc-jobs", properties: {}, occurredAt: at.toISOString() },
      { id: crypto.randomUUID(), name: "page_view", path: "/jobs", properties: {}, occurredAt: new Date(at.getTime() + 1000).toISOString() },
      { id: crypto.randomUUID(), name: "apply_click", path: "/jobs", properties: {}, occurredAt: new Date(at.getTime() + 2000).toISOString() },
    ] }, new Date(at.getTime() + 3000));
    await db.prepare("INSERT INTO analytics_events (id,session_id,name,path,source,device,origin,occurred_at,received_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(), session, "application_sent", "/jobs/:id/apply", "internal", "desktop", "server", at.toISOString(), at.toISOString()).run();
    const today = new Date("2026-10-25T12:00:00Z");
    await writeEvents(db, { consent: true, sessionId: crypto.randomUUID(), source: "claude", device: "mobile", events: [{ id: crypto.randomUUID(), name: "page_view", path: "/jobs", properties: {}, occurredAt: today.toISOString() }] }, today);
    const report = await aiAcquisitionReport(db, new Date("2026-10-25T16:00:00Z"));
    const last = report.periods.find(p => p.label === "last7")!;
    assert.equal(last.aiTraffic.sessions, 1);
    assert.equal(last.aiTraffic.pageviews, 2);
    assert.equal(last.aiTraffic.applyClicks, 1);
    assert.equal(last.aiTraffic.applicationsSent, 1);
    assert.equal(report.aiEntries.find(r => r.period === "last7")?.entryPath, "/tutorials/find-paid-ugc-jobs");
    assert.equal(report.periods.find(p => p.label === "today")?.aiTraffic.sessions, 1);
    assert.equal(report.periods.find(p => p.label === "previous7")?.aiTraffic.sessions, 0);
    assert.equal(last.endsAt, "2026-10-25T04:00:00.000Z");
    assert.ok(!JSON.stringify(report).includes(session));
  } finally { await mf.dispose(); }
});

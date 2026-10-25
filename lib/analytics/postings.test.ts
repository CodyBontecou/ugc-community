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

import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import type { BoardBindings } from "./sync";
import { syncJobBoard } from "./sync";
import { normalizeSource, sourceKey, submissionSchema, type BoardJob } from "./model";
import { storeSource, reviewJob, submitDirectJob, type ReviewInput } from "./store";
import { listBoardJobs, supplyReport } from "./search";
import { readBody, sameOrigin } from "./http";
import { seedAuditLeads } from "./seed";
import leads from "../../content/jobs/audit-leads.json";
const mf = new Miniflare({ modules: true, script: "export default { fetch() { return new Response('test'); } }", compatibilityDate: "2026-07-25", d1Databases: ["JOB_BOARD"], r2Buckets: ["SUBSCRAPE_EXPORTS"] });
const env = await mf.getBindings<BoardBindings>();
const db = env.JOB_BOARD;
const now = new Date().toISOString(), future = new Date(Date.now() + 86400_000).toISOString();
const archive = (id: string, extra = {}) => ({ type: "source", source: `https://www.reddit.com/r/UGCcreators/comments/post123/brief/${id}/`, title: "Hiring creators", subreddit: "UGCcreators", fullText: "We are hiring UGC creators for USD $250 per video. Apply at our hiring form.", publishedAt: now, capturedAt: now, classification: "paid_ugc_job", compensationType: "cash", compensationEvidence: "$250 per video", contentStatus: "available", ...extra });
const filters = { q: "", source: "", pay: "", page: 1 };
before(async () => {
  const sql = await readFile(new URL("../../migrations/job-board/0001_job_board.sql", import.meta.url), "utf8");
  for (const statement of sql.replace(/^--.*$/gm, "").split(";").filter(s => s.trim())) await db.prepare(statement).run();
  await db.prepare("UPDATE board_validation_window SET starts_at=?, ends_at=?").bind(new Date(Date.now() - 3600_000).toISOString(), new Date(Date.now() + 14 * 86400_000).toISOString()).run();
});
after(async () => { await mf.dispose(); });
async function review(id: string, overrides: Partial<ReviewInput> = {}) {
  const job = await db.prepare("SELECT * FROM board_jobs WHERE id=?").bind(id).first<BoardJob>();
  assert.ok(job);
  return reviewJob(db, { id, expectedUpdatedAt: job.updated_at, action: "publish", company: "Example brand", title: `UGC role ${id}`, description: "Create an original product video for this brand's upcoming campaign.", compensationType: "cash", compensationText: "USD $250 per approved video", cashAmount: 250, deliverables: "One video", eligibility: "US, English", usageRights: "30 days organic use", applicationUrl: "https://example.com/apply", closingAt: future, campaignKey: `campaign-${id}`, notes: "Reviewed", verified: true, ...overrides });
}

test("normalizes source identity and keeps unknown dates unknown", async () => {
  const source = await normalizeSource(archive("comment1")); assert.ok(source);
  assert.equal(source.key, "reddit:post123:comment1");
  assert.equal(sourceKey("https://old.reddit.com/r/UGCcreators/comments/post123/another-title/comment1/?utm_source=test"), source.key);
  assert.equal((await normalizeSource(archive("comment1", { publishedAt: null })))?.publishedAt, null);
  assert.equal((await normalizeSource(archive("comment1", { capturedAt: future })))?.revision, source.revision);
  assert.equal(await normalizeSource(archive("comment1", { source: "https://evil.example/r/UGCcreators/comments/post123/a/comment1/" })), null);
  assert.equal(await normalizeSource({ type: "email", value: "jobs@example.com" }), null);
});

test("audit candidates stay private and cannot count as date-verified jobs", async () => {
  await seedAuditLeads(db, leads); await seedAuditLeads(db, leads);
  assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM board_jobs").first<{ n: number }>())?.n, 5);
  assert.equal((await listBoardJobs(db, filters)).total, 0);
  const lead = await db.prepare("SELECT id FROM board_jobs LIMIT 1").first<{ id: string }>();
  await assert.rejects(() => review(lead!.id), /Full source text/);
  assert.equal((await supplyReport(db)).qualifying, 0);
});

test("imports full sources, ignores contact matches, and never auto-publishes classifiers", async () => {
  await env.SUBSCRAPE_EXPORTS.put("incremental/jobs.jsonl", [archive("comment1"), archive("selfpromo", { classification: "creator_self_promotion" }), { type: "email", value: "jobs@example.com" }].map(r => JSON.stringify(r)).join("\n"));
  assert.equal((await syncJobBoard(env)).imported, 1);
  assert.equal((await syncJobBoard(env)).imported, 0);
  assert.equal((await listBoardJobs(db, filters)).total, 0);
  const counts = await db.prepare("SELECT COUNT(*) AS n FROM board_sources").first<{ n: number }>(); assert.equal(counts?.n, 2);
  const job = await db.prepare("SELECT id FROM board_jobs WHERE source_key='reddit:post123:comment1'").first<{ id: string }>(); assert.ok(job);
  await review(job.id);
  const feed = await listBoardJobs(db, { ...filters, q: "Example brand", pay: "cash" }); assert.equal(feed.total, 1);
  assert.equal((await listBoardJobs(db, { ...filters, source: "direct" })).total, 0);
  assert.equal((await listBoardJobs(db, { ...filters, q: "%" })).total, 0);
  assert.equal("submitter_email" in feed.jobs[0], false);
  assert.equal((await supplyReport(db)).qualifying, 1);
  await review(job.id); assert.equal((await supplyReport(db)).qualifying, 1);
});

test("changed or removed sources withdraw listings; replay cannot regress a newer snapshot", async () => {
  const source = await normalizeSource(archive("comment1", { fullText: "Changed brief. Hiring UGC creators, USD $350 per video.", capturedAt: future })); assert.ok(source);
  await storeSource(db, source);
  assert.equal((await listBoardJobs(db, filters)).total, 0);
  const job = await db.prepare("SELECT id FROM board_jobs WHERE source_key=?").bind(source.key).first<{ id: string }>(); assert.ok(job);
  await review(job.id);
  await storeSource(db, (await normalizeSource(archive("comment1")))!);
  assert.equal((await listBoardJobs(db, filters)).total, 1);
  await storeSource(db, (await normalizeSource(archive("comment1", { contentStatus: "removed", fullText: "[removed]", capturedAt: new Date(Date.now() + 2 * 86400_000).toISOString() })))!);
  assert.equal((await listBoardJobs(db, filters)).total, 0);
});

test("expired listings leave the feed without erasing historical qualifying yield", async () => {
  await storeSource(db, (await normalizeSource(archive("expiry")))!);
  const job = await db.prepare("SELECT id FROM board_jobs WHERE source_key='reddit:post123:expiry'").first<{ id: string }>(); assert.ok(job);
  await review(job.id);
  const before = (await supplyReport(db)).qualifying;
  await db.prepare("UPDATE board_jobs SET closing_at=? WHERE id=?").bind(new Date(Date.now() - 1000).toISOString(), job.id).run();
  assert.equal((await listBoardJobs(db, { ...filters, q: `UGC role ${job.id}` })).total, 0);
  assert.equal((await supplyReport(db)).qualifying, before);
  await review(job.id, { action: "reject" });
  assert.equal((await supplyReport(db)).qualifying, before - 1);
});

test("direct submissions require all terms, remain pending, and cannot spoof source or status", async () => {
  const valid = { contactEmail: "contact@example.com", company: "Direct brand", title: "Make a demo", description: "A product demo campaign", compensationType: "cash" as const, compensationText: "USD $250/video", cashAmount: 250, deliverables: "One 30-second video", eligibility: "US", usageRights: "Organic only, 30 days", applicationUrl: "https://example.com/apply", closingAt: future };
  for (const field of ["compensationText", "deliverables", "eligibility", "usageRights"]) assert.equal(submissionSchema.safeParse({ ...valid, [field]: "" }).success, false);
  assert.equal(submissionSchema.safeParse({ ...valid, closingAt: now }).success, false);
  assert.equal(submissionSchema.safeParse({ ...valid, cashAmount: null }).success, false);
  assert.equal(submissionSchema.safeParse({ ...valid, compensationType: "unspecified" }).success, false);
  assert.equal(submissionSchema.safeParse({ ...valid, contactEmail: "not-email" }).success, false);
  assert.equal(submissionSchema.safeParse({ ...valid, applicationUrl: "javascript:alert(1)" }).success, false);
  const parsed = submissionSchema.parse({ ...valid, source_kind: "external", status: "published" });
  const id = await submitDirectJob(db, parsed, { id: "brand-user", email: "private@example.com" });
  assert.equal((await listBoardJobs(db, { ...filters, source: "direct" })).total, 0);
  await assert.rejects(() => review(id, { usageRights: "" }), /Direct listings/);
  await review(id);
  assert.equal((await listBoardJobs(db, { ...filters, source: "direct" })).total, 1);
  await assert.rejects(() => review(id, { expectedUpdatedAt: "2000-01-01T00:00:00.000Z" }), /Listing changed/);
});

test("campaign dedupe and freshness review prevent duplicate or stale public jobs", async () => {
  await storeSource(db, (await normalizeSource(archive("duplicate")))!);
  const job = await db.prepare("SELECT id FROM board_jobs WHERE source_key='reddit:post123:duplicate'").first<{ id: string }>(); assert.ok(job);
  const other = await db.prepare("SELECT campaign_key FROM board_jobs WHERE source_kind='external' AND campaign_key IS NOT NULL LIMIT 1").first<{ campaign_key: string }>(); assert.ok(other);
  await assert.rejects(() => review(job.id, { campaignKey: other.campaign_key }), /Campaign already exists/);
  await review(job.id, { compensationType: "performance_only", cashAmount: null });
  const before = (await supplyReport(db)).qualifying;
  await db.prepare("UPDATE board_jobs SET verified_at=? WHERE id=?").bind(new Date(Date.now() - 8 * 86400_000).toISOString(), job.id).run();
  assert.equal((await listBoardJobs(db, { ...filters, q: `UGC role ${job.id}` })).total, 0);
  assert.equal((await supplyReport(db)).qualifying, before);
});

test("concurrent direct submissions enforce the daily cap atomically", async () => {
  const input = { contactEmail: "contact@example.com", company: "Rate limit brand", title: "UGC role", description: "A direct hiring opportunity", compensationType: "cash" as const, compensationText: "USD $200 per video", cashAmount: 200, deliverables: "One video", eligibility: "US", usageRights: "30 day organic usage", applicationUrl: "https://example.com/apply", closingAt: future };
  const results = await Promise.allSettled(Array.from({ length: 6 }, () => submitDirectJob(db, input, { id: "rate-limit-user", email: "limit@example.com" })));
  assert.equal(results.filter(result => result.status === "fulfilled").length, 5);
  assert.equal(results.filter(result => result.status === "rejected").length, 1);
});

test("correcting cash compensation to performance-only invalidates cash supply credit", async () => {
  await storeSource(db, (await normalizeSource(archive("correctedcash")))!);
  const job = await db.prepare("SELECT id FROM board_jobs WHERE source_key='reddit:post123:correctedcash'").first<{ id: string }>(); assert.ok(job);
  await review(job.id);
  const before = (await supplyReport(db)).qualifying;
  await review(job.id, { compensationType: "performance_only", cashAmount: null, compensationText: "$2 per 1,000 views, no guaranteed pay" });
  assert.equal((await supplyReport(db)).qualifying, before - 1);
});


test("canonical app origin works behind Next while foreign origins and oversized bodies are rejected", async () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3000";
  try {
    assert.equal(sameOrigin(new Request("http://localhost:3000/api", { headers: { Origin: "http://127.0.0.1:3000" } })), true);
    assert.equal(sameOrigin(new Request("http://localhost:3000/api", { headers: { Origin: "https://evil.example" } })), false);
    await assert.rejects(() => readBody(new Request("http://localhost/api", { method: "POST", body: "x".repeat(100) }), 50), /too large/);
  } finally { if (original === undefined) delete process.env.NEXT_PUBLIC_APP_URL; else process.env.NEXT_PUBLIC_APP_URL = original; }
});

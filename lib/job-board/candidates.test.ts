import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import type { D1Database } from "@/cloudflare-env";
import { isReviewCandidate } from "./candidates";
import { recoverReviewCandidates } from "./recover";
import { storeSource } from "./store";
import type { SourceSnapshot } from "./model";
import missedBriefs from "./fixtures/missed-hiring-briefs.json";

const snapshot = (body: string, extra: Partial<SourceSnapshot> = {}): SourceSnapshot => ({
  key: "reddit:recovery:post", revision: "original", source: "https://www.reddit.com/r/ugc/comments/recovery/brief/",
  title: "Hiring creators", fullText: body, publishedAt: new Date().toISOString(), capturedAt: new Date().toISOString(),
  contentStatus: "available", classification: "other", compensationType: "unspecified", compensationText: "", ...extra,
});

test("real hiring briefs missed upstream enter private review, including performance-only offers", () => {
  for (const fixture of missedBriefs) assert.equal(isReviewCandidate(snapshot(fixture.fullText, fixture)), true, fixture.title);
  assert.equal(isReviewCandidate(snapshot("Paid per view", { classification: "performance_only_offer" })), true);
});

test("parent hiring context, self promotion, roundups and withdrawn sources do not create fallback candidates", () => {
  for (const body of ["Interested! My portfolio is example.com.", "How do I find creators hiring?", "We are no longer hiring creators. Send a portfolio.", ""]) {
    assert.equal(isReviewCandidate(snapshot(body)), false, body);
  }
  for (const classification of ["creator_self_promotion", "opportunity_roundup", "platform_signup", "duplicate_campaign_source", "creator_job"]) {
    assert.equal(isReviewCandidate(snapshot(missedBriefs[0].fullText, { classification })), false, classification);
  }
  assert.equal(isReviewCandidate(snapshot(missedBriefs[0].fullText, { contentStatus: "removed" })), false);
});

test("historical recovery is idempotent, preserves source evidence, and cannot reopen reviewed jobs", async () => {
  const mf = new Miniflare({ modules: true, script: "export default {fetch(){return new Response('test')}}", compatibilityDate: "2026-07-25", d1Databases: ["JOB_BOARD"] });
  try {
    const { JOB_BOARD: db } = await mf.getBindings<{ JOB_BOARD: D1Database }>();
    const sql = await readFile(new URL("../../migrations/job-board/0001_job_board.sql", import.meta.url), "utf8");
    for (const statement of sql.replace(/^--.*$/gm, "").split(";").filter(s => s.trim())) await db.prepare(statement).run();
    const source = snapshot(missedBriefs[0].fullText);
    // Seed the archived source exactly as the old importer did, with no candidate.
    await db.prepare("INSERT INTO board_sources VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(source.key, source.revision, source.source, source.title, source.fullText, source.publishedAt, source.capturedAt, source.contentStatus, source.classification).run();
    assert.deepEqual(await recoverReviewCandidates(db), { scanned: 1, recovered: 1 });
    const job = await db.prepare("SELECT id,status,verified_at,campaign_key FROM board_jobs").first<{id: string; status: string; verified_at: string | null; campaign_key: string | null}>();
    assert.ok(job); assert.equal(job.status, "pending_review"); assert.equal(job.verified_at, null); assert.equal(job.campaign_key, null);
    assert.deepEqual(await recoverReviewCandidates(db), { scanned: 0, recovered: 0 });
    const stored = await db.prepare("SELECT * FROM board_sources").first();
    assert.equal(stored?.revision, source.revision); assert.equal(stored?.captured_at, source.capturedAt); assert.equal(stored?.classification, "other");
    for (const status of ["published", "rejected", "closed"]) {
      await db.prepare("UPDATE board_jobs SET status=?,company='Reviewed employer',review_notes='Reviewed evidence' WHERE id=?").bind(status, job.id).run();
      await storeSource(db, source);
      const reviewed: { status: string; company: string; review_notes: string } | null = await db.prepare("SELECT status,company,review_notes FROM board_jobs WHERE id=?").bind(job.id)
        .first<{ status: string; company: string; review_notes: string }>();
      assert.deepEqual(reviewed, { status, company: "Reviewed employer", review_notes: "Reviewed evidence" });
    }
    await storeSource(db, { ...source, revision: "edited", fullText: source.fullText + " Updated scope." });
    assert.equal((await db.prepare("SELECT status FROM board_jobs WHERE id=?").bind(job.id).first())?.status, "pending_review");
    await storeSource(db, { ...source, revision: "removed", contentStatus: "removed", fullText: "[removed]" });
    assert.equal((await db.prepare("SELECT status FROM board_jobs WHERE id=?").bind(job.id).first())?.status, "closed");
  } finally { await mf.dispose(); }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import type { D1Database } from "@/cloudflare-env";
import { normalizeSideShiftCapture } from "./sideshift";
import { storeSource } from "./store";
import { refreshTargets } from "./refresh-targets";

const capture = {
  id: "PublicJob123", capturedAt: new Date().toISOString(),
  payload: { success: true, company: { name: "Example brand", privateContact: "private@example.test" }, job: {
    id: "PublicJob123", title: "Film an app demonstration", description: "Create one short app demo. Apply through this job page.",
    createdAt: "2026-10-17T11:06:48.920Z", fixedAmount: "100", paymentType: "fixed", applicantCount: 5,
    postingStatus: "completed", openCampaign: false,
  } },
};

test("public capture keeps exact source dates and terms but cannot infer approval or expose unrelated data", async () => {
  const source = await normalizeSideShiftCapture(capture); assert.ok(source);
  assert.equal(source.key, "sideshift:PublicJob123"); assert.equal(source.publishedAt, capture.payload.job.createdAt);
  assert.equal(source.source, "https://app.sideshift.app/jobs/PublicJob123");
  assert.equal(source.compensationType, "unspecified"); assert.equal(source.classification, "hiring_unconfirmed");
  assert.ok(source.fullText.includes('"fixedAmount":"100"'));
  assert.ok(!source.fullText.includes("private@example.test")); assert.ok(!source.fullText.includes("applicantCount"));
  assert.ok(source.fullText.includes('"postingStatus":"completed"'));
  assert.ok(source.fullText.includes('"openCampaign":false')); assert.equal(source.contentStatus, "available");
  const repeat = await normalizeSideShiftCapture({ ...capture, capturedAt: new Date(Date.now() + 1000).toISOString(), payload: { ...capture.payload, job: { ...capture.payload.job, applicantCount: 99 } } });
  assert.equal(repeat?.revision, source.revision);
  assert.equal((await normalizeSideShiftCapture({ ...capture, payload: { ...capture.payload, job: { ...capture.payload.job, createdAt: null } } }))?.publishedAt, null);
  assert.equal(await normalizeSideShiftCapture({ ...capture, id: "different" }), null);
  assert.equal(await normalizeSideShiftCapture({ ...capture, payload: { success: false } }), null);
});

test("imported public jobs stay private, preserve reviewed replays, and never enter the Reddit refresh manifest", async () => {
  const mf = new Miniflare({ modules: true, script: "export default {fetch(){return new Response('test')}}", compatibilityDate: "2026-07-25", d1Databases: ["JOB_BOARD"] });
  try {
    const { JOB_BOARD: db } = await mf.getBindings<{ JOB_BOARD: D1Database }>();
    const sql = await readFile(new URL("../../migrations/job-board/0001_job_board.sql", import.meta.url), "utf8");
    for (const statement of sql.replace(/^--.*$/gm, "").split(";").filter(s => s.trim())) await db.prepare(statement).run();
    const source = await normalizeSideShiftCapture(capture); assert.ok(source);
    await storeSource(db, source);
    const job = await db.prepare("SELECT status,verified_at FROM board_jobs").first();
    assert.deepEqual(job, { status: "pending_review", verified_at: null });
    await db.prepare("UPDATE board_jobs SET status='published',published_at=?,review_notes='Reviewed'").bind(new Date().toISOString()).run();
    await storeSource(db, source);
    assert.equal((await db.prepare("SELECT status FROM board_jobs").first())?.status, "published");
    assert.deepEqual(await refreshTargets(db), { sources: [], truncated: false });
  } finally { await mf.dispose(); }
});

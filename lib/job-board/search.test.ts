import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import type { D1Database } from "@/cloudflare-env";
import { listBoardJobs } from "./search";

test("parallel feed reads preserve pagination, out-of-range recovery, and expiry", async () => {
  const mf = new Miniflare({ modules: true, script: "export default {fetch(){return new Response('test')}}", compatibilityDate: "2026-07-25", d1Databases: ["JOB_BOARD"] });
  try {
    const { JOB_BOARD: db } = await mf.getBindings<{ JOB_BOARD: D1Database }>();
    for (const file of ["0001_job_board.sql", "0002_applications.sql"]) {
      const sql = await readFile(new URL(`../../migrations/job-board/${file}`, import.meta.url), "utf8");
      for (const statement of sql.replace(/^--.*$/gm, "").split(";").filter(s => s.trim())) await db.prepare(statement).run();
    }
    const now = "2026-10-25T12:00:00.000Z";
    await db.batch(Array.from({ length: 23 }, (_, i) => db.prepare("INSERT INTO board_jobs (id, source_kind, status, company, title, description, created_at, updated_at, published_at) VALUES (?, 'direct', 'published', 'Example', 'UGC opportunity', 'Create one product video.', ?, ?, ?)").bind(`job-${String(i).padStart(3, "0")}`, now, now, now)));
    await db.prepare("UPDATE board_jobs SET closing_at='2026-10-24T12:00:00.000Z' WHERE id='job-000'").run();
    await db.prepare("UPDATE board_jobs SET source_kind='external', verified_at='2026-10-01T12:00:00.000Z' WHERE id='job-001'").run();
    const filters = { q: "", source: "", pay: "", page: 1 };
    const first = await listBoardJobs(db, filters, now);
    assert.equal(first.total, 21);
    assert.equal(first.page, 1);
    assert.equal(first.jobs.length, 20);
    assert.equal(first.jobs[0].id, "job-002");
    for (const page of [2, 999, Infinity]) {
      const last = await listBoardJobs(db, { ...filters, page }, now);
      assert.equal(last.page, 2);
      assert.deepEqual(last.jobs.map(job => job.id), ["job-022"]);
    }
    for (const page of [0, -1, NaN]) assert.equal((await listBoardJobs(db, { ...filters, page }, now)).page, 1);
    const empty = await listBoardJobs(db, { ...filters, q: "no such role", page: 999 }, now);
    assert.equal(empty.total, 0);
    assert.equal(empty.page, 1);
    assert.deepEqual(empty.jobs, []);
  } finally { await mf.dispose(); }
});

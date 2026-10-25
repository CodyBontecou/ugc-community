import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import type { D1Database } from "@/cloudflare-env";
import { boardFilterSnapshot, boardFilterCounts } from "../job-board/search";

test("cache deadline covers closing and external freshness across the entire feed", async () => {
  const mf = new Miniflare({ modules: true, script: "export default {fetch(){return new Response('test')}}", compatibilityDate: "2026-07-25", d1Databases: ["JOB_BOARD"] });
  try {
    const { JOB_BOARD: db } = await mf.getBindings<{ JOB_BOARD: D1Database }>();
    const sql = await readFile(new URL("../../migrations/job-board/0001_job_board.sql", import.meta.url), "utf8");
    for (const statement of sql.replace(/^--.*$/gm, "").split(";").filter(s => s.trim())) await db.prepare(statement).run();
    const now = "2026-10-25T12:00:00.000Z";
    await db.batch([db.prepare("INSERT INTO board_jobs (id,source_kind,status,company,title,description,created_at,updated_at,closing_at) VALUES ('closing','direct','published','Brand','Role','Brief',?,?,?)").bind(now, now, "2026-10-25T12:00:01.500Z"),
      db.prepare("INSERT INTO board_jobs (id,source_kind,status,company,title,description,created_at,updated_at,verified_at) VALUES ('freshness','external','published','Brand','Role','Brief',?,?,?)").bind(now, now, "2026-10-18T12:00:03.000Z"),
      db.prepare("INSERT INTO board_jobs (id,source_kind,status,company,title,description,created_at,updated_at,closing_at) VALUES ('later','direct','published','Brand','Role','Brief',?,?,?)").bind(now, now, "2026-10-25T12:15:00.000Z")]);
    assert.equal((await boardFilterSnapshot(db, now)).validUntil, Date.parse("2026-10-25T12:00:01.500Z"));
    const next = await boardFilterSnapshot(db, "2026-10-25T12:00:02.000Z");
    assert.equal(next.counts.total, 2);
    assert.equal(next.validUntil, Date.parse("2026-10-25T12:00:03.000Z"));
    assert.deepEqual(await boardFilterCounts(db, now), { total: 3, cash: 0, direct: 2 });
    const expired = await boardFilterSnapshot(db, "2026-10-25T12:20:00.000Z");
    assert.equal(expired.counts.total, 0);
    assert.equal(expired.validUntil, Infinity);
  } finally { await mf.dispose(); }
});

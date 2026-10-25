import type { R2Object } from "@/cloudflare-env";
import { parseExport, MAX_EXPORT_BYTES } from "@/lib/creator-database/records";
import { normalizeSource } from "./model";
import { storeSources } from "./store";
export type BoardBindings = Pick<CloudflareEnv, "JOB_BOARD" | "SUBSCRAPE_EXPORTS">;

async function importJobObject(env: BoardBindings, object: R2Object) {
  const db = env.JOB_BOARD;
  const previous = await db.prepare("SELECT etag FROM board_imports WHERE object_key=?").bind(object.key).first<{ etag: string }>();
  if (previous?.etag === object.etag) return false;
  if (object.size > MAX_EXPORT_BYTES) throw new Error("Export exceeds the 8 MB import limit");
  const file = await env.SUBSCRAPE_EXPORTS.get(object.key);
  if (!file || file.size > MAX_EXPORT_BYTES) throw new Error("Export unavailable or too large");
  let sources = 0, legacy = 0, rejected = 0;
  const latest = new Map<string, NonNullable<Awaited<ReturnType<typeof normalizeSource>>>>();
  for (const input of parseExport(await file.text(), object.key)) {
    if (typeof input === "object" && input && "type" in input && input.type !== "source") { legacy++; continue; }
    const source = await normalizeSource(input);
    if (!source) { rejected++; continue; }
    const previous = latest.get(source.key);
    if (!previous || previous.capturedAt <= source.capturedAt) latest.set(source.key, source);
    sources++;
  }
  await storeSources(db, [...latest.values()]);
  // Snapshot and observation identities make replay after interruption safe.
  await db.batch([
    db.prepare(`INSERT INTO board_imports VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(object_key) DO UPDATE SET
      etag=excluded.etag, imported_at=excluded.imported_at, source_records=excluded.source_records,
      legacy_records=excluded.legacy_records, rejected=excluded.rejected`)
      .bind(object.key, file.etag, new Date().toISOString(), sources, legacy, rejected),
    db.prepare("DELETE FROM board_import_errors WHERE object_key=?").bind(object.key),
  ]);
  return true;
}
export async function syncJobBoard(env: BoardBindings) {
  const db = env.JOB_BOARD, token = crypto.randomUUID(), now = Date.now();
  const state = await db.prepare(`UPDATE board_sync_state SET lease_token=?, lease_until=? WHERE id=1 AND lease_until<?
    RETURNING incremental_cursor, exports_cursor`).bind(token, now + 600_000, now)
    .first<{ incremental_cursor: string | null; exports_cursor: string | null }>();
  if (!state) return { busy: true, imported: 0, failed: 0 };
  let imported = 0, failed = 0;
  try {
    for (const prefix of ["incremental/", "exports/"]) {
      const column = prefix === "incremental/" ? "incremental_cursor" : "exports_cursor";
      const page = await env.SUBSCRAPE_EXPORTS.list({ prefix, limit: 20, cursor: state[column] || undefined });
      for (const object of page.objects) {
        if (!/\.(json|jsonl|csv)$/.test(object.key)) continue;
        if (Date.now() - now > 50_000) return { busy: false, imported, failed };
        try { if (await importJobObject(env, object)) imported++; }
        catch {
          failed++;
          await db.prepare(`INSERT INTO board_import_errors VALUES (?, 'Import failed; check format, size, or binding access', ?)
            ON CONFLICT(object_key) DO UPDATE SET message=excluded.message, failed_at=excluded.failed_at`).bind(object.key, new Date().toISOString()).run();
        }
      }
      await db.prepare(`UPDATE board_sync_state SET ${column}=? WHERE id=1 AND lease_token=?`).bind(page.truncated ? page.cursor : null, token).run();
    }
    await db.prepare("UPDATE board_sync_state SET last_completed_at=? WHERE id=1 AND lease_token=?").bind(new Date().toISOString(), token).run();
    console.log(JSON.stringify({ event: "job_board_sync", imported, failed }));
    return { busy: false, imported, failed };
  } finally { await db.prepare("UPDATE board_sync_state SET lease_token=NULL, lease_until=0 WHERE id=1 AND lease_token=?").bind(token).run(); }
}

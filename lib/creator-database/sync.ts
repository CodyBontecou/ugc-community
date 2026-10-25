import type { R2Object } from "@/cloudflare-env";
import { MAX_EXPORT_BYTES, normalizeMatch, parseExport } from "./records";

export type CreatorBindings = Pick<CloudflareEnv, "SUBSCRAPE_EXPORTS" | "CREATOR_DATABASE">;

export async function importObject(env: CreatorBindings, object: R2Object) {
  const db = env.CREATOR_DATABASE;
  const previous = await db.prepare("SELECT etag FROM creator_imports WHERE object_key = ?").bind(object.key).first<{ etag: string }>();
  if (previous?.etag === object.etag) return { changed: false, accepted: 0, rejected: 0 };
  if (object.size > MAX_EXPORT_BYTES) throw new Error("Export exceeds 8 MB import limit");
  const file = await env.SUBSCRAPE_EXPORTS.get(object.key);
  if (!file) throw new Error("Export disappeared before import");
  if (file.size > MAX_EXPORT_BYTES) throw new Error("Export exceeds 8 MB import limit");
  // R2 size is known before buffering. Staged versions remain invisible to
  // search until the final atomic checkpoint commits this exact ETag.
  const inputs = parseExport(await file.text(), object.key);
  const unique = new Map<string, NonNullable<Awaited<ReturnType<typeof normalizeMatch>>>>();
  let rejected = 0;
  for (const input of inputs) {
    const match = await normalizeMatch(input);
    if (match) {
      const existing = unique.get(match.id);
      if (!existing || match.capturedAt > existing.capturedAt) unique.set(match.id, match);
    } else rejected++;
  }
  const matches = [...unique.values()];
  for (let offset = 0; offset < matches.length; offset += 50) {
    await db.batch(matches.slice(offset, offset + 50).map(match => db.prepare(`
      INSERT INTO creator_matches (object_key, etag, record_id, author, type, value, source, title, evidence, confidence, captured_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (object_key, etag, record_id) DO UPDATE SET captured_at = excluded.captured_at,
        evidence = excluded.evidence, title = excluded.title
    `).bind(object.key, file.etag, match.id, match.author, match.type, match.value, match.source, match.title, match.evidence, match.confidence, match.capturedAt)));
  }
  await db.batch([
    db.prepare(`INSERT INTO creator_imports (object_key, etag, imported_at, accepted, rejected) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (object_key) DO UPDATE SET etag=excluded.etag, imported_at=excluded.imported_at, accepted=excluded.accepted, rejected=excluded.rejected`)
      .bind(object.key, file.etag, new Date().toISOString(), matches.length, rejected),
    db.prepare("DELETE FROM creator_matches WHERE object_key = ? AND etag <> ?").bind(object.key, file.etag),
    db.prepare("DELETE FROM creator_import_errors WHERE object_key = ?").bind(object.key),
  ]);
  return { changed: true, accepted: matches.length, rejected };
}

export async function syncCreatorDatabase(env: CreatorBindings) {
  const db = env.CREATOR_DATABASE;
  const token = crypto.randomUUID();
  const now = Date.now();
  const state = await db.prepare(`UPDATE creator_sync_state SET lease_token=?, lease_until=?, last_run_at=?
    WHERE id=1 AND lease_until < ? RETURNING incremental_cursor, exports_cursor`)
    .bind(token, now + 10 * 60_000, new Date(now).toISOString(), now)
    .first<{ incremental_cursor: string | null; exports_cursor: string | null }>();
  if (!state) return { busy: true, imported: 0, failed: 0 };
  let imported = 0, failed = 0;
  try {
    // Separate cursors keep new uploads and legacy backfills progressing.
    // At most 20 objects per prefix per run; full scans repeat, so late and
    // overwritten keys are discovered even if they sort before the cursor.
    for (const prefix of ["incremental/", "exports/"] as const) {
      const column = prefix === "incremental/" ? "incremental_cursor" : "exports_cursor";
      const page = await env.SUBSCRAPE_EXPORTS.list({ prefix, limit: 20, cursor: state[column] || undefined });
      for (const object of page.objects) {
        if (!/\.(jsonl|json|csv)$/.test(object.key)) continue;
        // Do not checkpoint an unfinished page; replaying it is idempotent.
        if (Date.now() - now > 50_000) return { busy: false, imported, failed };
        try {
          const result = await importObject(env, object);
          if (result.changed) imported++;
        } catch (error) {
          failed++;
          const message = error instanceof Error && /^(Export |Invalid |Too many |Duplicate |Unsupported )/.test(error.message)
            ? error.message.slice(0, 160) : "Import failed; will retry on the next scan";
          await db.prepare(`INSERT INTO creator_import_errors (object_key, etag, message, failed_at) VALUES (?, ?, ?, ?)
            ON CONFLICT (object_key) DO UPDATE SET etag=excluded.etag, message=excluded.message, failed_at=excluded.failed_at`)
            .bind(object.key, object.etag, message, new Date().toISOString()).run();
        }
      }
      await db.prepare(`UPDATE creator_sync_state SET ${column}=? WHERE id=1 AND lease_token=?`)
        .bind(page.truncated ? page.cursor : null, token).run();
    }
    await db.prepare("UPDATE creator_sync_state SET last_completed_at=? WHERE id=1 AND lease_token=?")
      .bind(new Date().toISOString(), token).run();
    console.log(JSON.stringify({ event: "creator_database_sync", imported, failed }));
    return { busy: false, imported, failed };
  } finally {
    await db.prepare("UPDATE creator_sync_state SET lease_until=0, lease_token=NULL WHERE id=1 AND lease_token=?").bind(token).run();
  }
}

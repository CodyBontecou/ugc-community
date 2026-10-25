import type { D1Database } from "@/cloudflare-env";

export async function refreshTargets(db: D1Database) {
  const rows = await db.prepare(`SELECT j.source_key AS sourceKey, j.source_url AS source, s.title
    FROM board_jobs j JOIN board_sources s ON s.source_key=j.source_key
    WHERE j.source_kind='external' AND j.published_at IS NOT NULL
      AND j.status IN ('published','pending_review')
      AND (j.closing_at IS NULL OR j.closing_at>?)
    ORDER BY j.id LIMIT 501`).bind(new Date().toISOString()).all<{ sourceKey: string; source: string; title: string }>();
  return { sources: rows.results.slice(0, 500), truncated: rows.results.length > 500 };
}

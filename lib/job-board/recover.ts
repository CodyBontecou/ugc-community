import type { D1Database } from "@/cloudflare-env";
import type { SourceSnapshot } from "./model";
import { isReviewCandidate } from "./candidates";
import { storeSources } from "./store";

export async function recoverReviewCandidates(db: D1Database) {
  let cursor = "", scanned = 0, recovered = 0;
  for (;;) {
    const page = await db.prepare(`SELECT s.* FROM board_sources s
      WHERE s.source_key>? AND NOT EXISTS (SELECT 1 FROM board_jobs j WHERE j.source_key=s.source_key)
      ORDER BY s.source_key LIMIT 100`).bind(cursor).all<{
        source_key: string; revision: string; source_url: string; title: string; full_text: string;
        published_at: string | null; captured_at: string; content_status: string; classification: string;
      }>();
    if (!page.results.length) break;
    scanned += page.results.length;
    cursor = page.results.at(-1)!.source_key;
    const candidates: SourceSnapshot[] = page.results.map(row => ({
      key: row.source_key, revision: row.revision, source: row.source_url, title: row.title,
      fullText: row.full_text, publishedAt: row.published_at, capturedAt: row.captured_at,
      contentStatus: row.content_status, classification: row.classification,
      compensationType: "unspecified", compensationText: "",
    })).filter(isReviewCandidate);
    await storeSources(db, candidates);
    recovered += candidates.length;
  }
  return { scanned, recovered };
}

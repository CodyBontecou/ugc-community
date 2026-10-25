import type { D1Database } from "@/cloudflare-env";
import type { MatchType } from "./records";

export interface SearchFilters {
  query: string;
  platform: "" | "instagram" | "tiktok" | "youtube";
  emailOnly: boolean;
  page: number;
}
export interface MatchDetail {
  type: MatchType;
  value: string;
  source: string;
  title: string;
  evidence: string;
  confidence: string;
  capturedAt: string;
}
export interface CreatorRecord {
  author: string;
  firstSeen: string;
  lastSeen: string;
  hasEmail: number;
  hasPortfolio: number;
  instagram: number;
  tiktok: number;
  youtube: number;
  detailCount: number;
  details: MatchDetail[];
}
export interface SearchResults {
  creators: CreatorRecord[];
  total: number;
  page: number;
  pageSize: number;
  sync: { lastRunAt: string | null; lastCompletedAt: string | null; objects: number; failures: number };
}

const ACTIVE = `FROM creator_matches m JOIN creator_imports i ON i.object_key=m.object_key AND i.etag=m.etag
  WHERE NOT EXISTS (SELECT 1 FROM creator_suppressions s WHERE s.author=m.author)`;
const SUMMARY = `SELECT m.author, MIN(m.captured_at) AS firstSeen, MAX(m.captured_at) AS lastSeen,
  MAX(m.type='email') AS hasEmail, MAX(m.type='portfolio') AS hasPortfolio,
  MAX(m.type='instagram') AS instagram, MAX(m.type='tiktok') AS tiktok, MAX(m.type='youtube') AS youtube,
  COUNT(DISTINCT m.record_id) AS detailCount`;

export async function searchCreators(db: D1Database, filters: SearchFilters): Promise<SearchResults> {
  const pageSize = 25;
  const conditions: string[] = [];
  const bindings: (string | number)[] = [];
  if (filters.query) {
    conditions.push(`EXISTS (SELECT 1 FROM creator_matches q JOIN creator_imports qi ON qi.object_key=q.object_key AND qi.etag=q.etag
      WHERE q.author=m.author AND (q.author LIKE ? ESCAPE '\\' OR q.value LIKE ? ESCAPE '\\' OR q.title LIKE ? ESCAPE '\\'))`);
    const term = `%${filters.query.replace(/[\\%_]/g, value => `\\${value}`)}%`;
    bindings.push(term, term, term);
  }
  if (filters.platform) {
    conditions.push(`EXISTS (SELECT 1 FROM creator_matches p JOIN creator_imports pi ON pi.object_key=p.object_key AND pi.etag=p.etag WHERE p.author=m.author AND p.type=?)`);
    bindings.push(filters.platform);
  }
  const group = `${ACTIVE}${conditions.length ? ` AND ${conditions.join(" AND ")}` : ""} GROUP BY m.author${filters.emailOnly ? " HAVING MAX(m.type='email')=1" : ""}`;
  const count = await db.prepare(`SELECT COUNT(*) AS total FROM (${SUMMARY} ${group})`).bind(...bindings).first<{ total: number }>();
  const total = count?.total || 0;
  const page = Math.min(filters.page, Math.max(1, Math.ceil(total / pageSize)));
  const result = await db.prepare(`${SUMMARY} ${group} ORDER BY lastSeen DESC, m.author ASC LIMIT ? OFFSET ?`)
    .bind(...bindings, pageSize, (page - 1) * pageSize).all<Omit<CreatorRecord, "details">>();
  const creators: CreatorRecord[] = result.results.map(row => ({ ...row, details: [] }));
  if (creators.length) {
    const details = await db.prepare(`SELECT * FROM (
      SELECT m.author, m.type, m.value, m.source, m.title, m.evidence, m.confidence, m.captured_at AS capturedAt,
        ROW_NUMBER() OVER (PARTITION BY m.author ORDER BY m.captured_at DESC, m.record_id) AS rank
      FROM (SELECT m.*, ROW_NUMBER() OVER (PARTITION BY m.record_id ORDER BY m.captured_at DESC) AS copy ${ACTIVE}) m
      WHERE m.copy=1 AND m.author IN (${creators.map(() => "?").join(",")})
    ) WHERE rank <= 30 ORDER BY capturedAt DESC`)
      .bind(...creators.map(creator => creator.author)).all<MatchDetail & { author: string }>();
    const byAuthor = new Map(creators.map(creator => [creator.author, creator]));
    for (const detail of details.results) byAuthor.get(detail.author)?.details.push(detail);
  }
  const sync = await db.prepare(`SELECT last_run_at AS lastRunAt, last_completed_at AS lastCompletedAt,
    (SELECT COUNT(*) FROM creator_imports) AS objects, (SELECT COUNT(*) FROM creator_import_errors) AS failures FROM creator_sync_state WHERE id=1`)
    .first<SearchResults["sync"]>();
  return { creators, total, page, pageSize, sync: sync || { lastRunAt: null, lastCompletedAt: null, objects: 0, failures: 0 } };
}

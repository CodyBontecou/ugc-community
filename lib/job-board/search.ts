import type { D1Database } from "@/cloudflare-env";
import type { BoardJob } from "./model";

export interface JobFilters { q: string; source: string; pay: string; page: number }
export const PUBLIC_FIELDS = "id, source_kind, company, title, description, compensation_type, compensation_text, cash_amount, deliverables, eligibility, usage_rights, application_url, CASE WHEN application_email IS NOT NULL THEN 1 ELSE 0 END AS email_apply_enabled, closing_at, source_url, source_published_at, captured_at, verified_at, published_at";
// External listings expire seven days after a live check or the capture used
// in an archive review. Rereading an old archive cannot renew freshness.
export const VISIBLE = "status='published' AND (closing_at IS NULL OR closing_at>?) AND (source_kind='direct' OR verified_at>=?)";
export function visibleBindings(now: string) { return [now, new Date(new Date(now).getTime() - 7 * 86400_000).toISOString()]; }
export async function listBoardJobs(db: D1Database, filters: JobFilters, now = new Date().toISOString()) {
  const clauses = [VISIBLE];
  const values: (string | number)[] = visibleBindings(now);
  if (filters.q) {
    clauses.push("(title LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')");
    const q = `%${filters.q.slice(0, 100).replace(/[\\%_]/g, x => `\\${x}`)}%`; values.push(q, q, q);
  }
  if (["external", "direct"].includes(filters.source)) { clauses.push("source_kind=?"); values.push(filters.source); }
  if (["cash", "mixed", "performance_only", "affiliate", "gifted_or_unpaid", "unspecified"].includes(filters.pay)) { clauses.push("compensation_type=?"); values.push(filters.pay); }
  const where = clauses.join(" AND ");
  const pageSize = 20;
  const requestedPage = Math.max(1, Math.floor(filters.page) || 1);
  const selectPage = (page: number) => db.prepare(`SELECT ${PUBLIC_FIELDS} FROM board_jobs WHERE ${where} ORDER BY published_at DESC, id LIMIT ? OFFSET ?`)
    .bind(...values, pageSize, Math.min(Number.MAX_SAFE_INTEGER, (page - 1) * pageSize)).all<BoardJob>();
  // The normal page does not depend on the count. Start both reads together
  // instead of adding a second database round trip to every public page load.
  const [count, requestedJobs] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS total FROM board_jobs WHERE ${where}`).bind(...values).first<{ total: number }>(),
    selectPage(requestedPage),
  ]);
  const total = count?.total || 0;
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / pageSize)));
  const jobs = page === requestedPage ? requestedJobs : await selectPage(page);
  return { jobs: jobs.results, total, page, pageSize };
}
export async function boardFilterCounts(db: D1Database, now = new Date().toISOString()) {
  const counts = await db.prepare(`SELECT COUNT(*) AS total,
    COALESCE(SUM(CASE WHEN compensation_type='cash' THEN 1 ELSE 0 END), 0) AS cash,
    COALESCE(SUM(CASE WHEN source_kind='direct' THEN 1 ELSE 0 END), 0) AS direct
    FROM board_jobs WHERE ${VISIBLE}`).bind(...visibleBindings(now)).first<{ total: number; cash: number; direct: number }>();
  return counts || { total: 0, cash: 0, direct: 0 };
}

export async function supplyReport(db: D1Database) {
  const window = await db.prepare("SELECT starts_at, ends_at FROM board_validation_window WHERE id=1").first<{ starts_at: string; ends_at: string }>();
  if (!window) throw new Error("Validation window not initialized");
  const stats = await db.prepare(`SELECT
    (SELECT COUNT(*) FROM board_sources) AS sources,
    (SELECT COUNT(*) FROM board_sources WHERE length(trim(full_text))>0) AS fullText,
    (SELECT COUNT(*) FROM board_sources WHERE published_at IS NOT NULL) AS originalDates,
    (SELECT COUNT(*) FROM board_jobs WHERE source_kind='external') AS candidates,
    (SELECT COUNT(*) FROM board_jobs WHERE source_kind='external' AND status='pending_review') AS pending,
    (SELECT COUNT(*) FROM board_jobs WHERE source_kind='external' AND status='published') AS reviewedCampaigns,
    (SELECT COUNT(*) FROM board_import_errors) AS errors,
    (SELECT last_completed_at FROM board_sync_state WHERE id=1) AS lastSync`).first<Record<string, number | string | null>>();
  // Historical approved supply persists when jobs close naturally. Rejected
  // qualifications are excluded, and the campaign primary key prevents inflation.
  const daily = await db.prepare(`SELECT date(first_seen_at, '-4 hours') AS day, COUNT(*) AS jobs
    FROM board_qualifications WHERE invalidated_at IS NULL AND first_seen_at>=? AND first_seen_at<?
      AND source_published_at>=? AND source_published_at<? GROUP BY day ORDER BY day`)
    .bind(window.starts_at, window.ends_at, window.starts_at, window.ends_at).all<{ day: string; jobs: number }>();
  return { window, stats, daily: daily.results, qualifying: daily.results.reduce((sum, day) => sum + day.jobs, 0) };
}

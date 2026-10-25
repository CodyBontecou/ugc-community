import type { D1Database } from "@/cloudflare-env";
import { reportDays } from "./model";
export class PostingNotFound extends Error {}
export type PostingMetrics = { briefs: number; clicks: number; sent: number; sessions: number };
export type PostingRow = PostingMetrics & { id: string; title: string; company: string; status: string; closingAt: string | null; createdAt: string };
export type PostingReport = {
  days: number; startsAt: string; endsAt: string; jobId: string | null;
  totalJobs: number; page: number; pageSize: number;
  current: PostingMetrics; previous: PostingMetrics; jobs: PostingRow[];
  daily: { day: string; briefs: number; clicks: number; sent: number }[];
  sources: { label: string; sessions: number }[]; devices: { label: string; sessions: number }[];
};
const METRICS = `COALESCE(SUM(e.name='job_brief_open'),0) AS briefs,
  COALESCE(SUM(e.name='apply_click'),0) AS clicks,
  COALESCE(SUM(e.name='application_sent' AND e.origin='server'),0) AS sent,
  COUNT(DISTINCT CASE WHEN e.origin='browser' THEN e.session_id END) AS sessions`;
const EMPTY: PostingMetrics = { briefs: 0, clicks: 0, sent: 0, sessions: 0 };
export function postingPage(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(10000, Math.max(1, Math.floor(n))) : 1;
}
export async function postingReport(db: D1Database, userId: string, options: { days?: number; jobId?: string | null; page?: number } = {}, now = new Date()): Promise<PostingReport> {
  if (!userId) throw new Error("Account is required");
  const days = reportDays(String(options.days)), jobId = options.jobId || null;
  // Resolve ownership before querying events. Admin status and matching emails never grant ownership.
  if (jobId && !await db.prepare("SELECT id FROM board_jobs WHERE id=? AND submitter_user_id=? AND source_kind='direct'").bind(jobId, userId).first()) throw new PostingNotFound("Posting not found");
  const scope = `j.submitter_user_id=? AND j.source_kind='direct'${jobId ? " AND j.id=?" : ""}`;
  const scopeValues = jobId ? [userId, jobId] : [userId];
  const totalJobs = (await db.prepare(`SELECT COUNT(*) AS n FROM board_jobs j WHERE ${scope}`).bind(...scopeValues).first<{ n: number }>())?.n || 0;
  const pageSize = 20, page = Math.min(postingPage(options.page), Math.max(1, Math.ceil(totalJobs / pageSize)));
  const end = now.toISOString(), start = new Date(now.getTime() - days * 86400_000).toISOString(), prior = new Date(now.getTime() - 2 * days * 86400_000).toISOString();
  const base: PostingReport = { days, startsAt: start, endsAt: end, jobId, totalJobs, page, pageSize, current: { ...EMPTY }, previous: { ...EMPTY }, jobs: [], daily: [], sources: [], devices: [] };
  if (!totalJobs) return base;
  const events = `e.name IN ('job_brief_open','apply_click','application_sent')`;
  const join = `JOIN analytics_events e ON json_extract(e.properties,'$.jobId')=j.id`;
  const filtered = `FROM board_jobs j ${join} WHERE ${scope} AND ${events} AND e.received_at>=? AND e.received_at<?`;
  const [current, previous, jobs, daily, sources, devices] = await Promise.all([
    db.prepare(`SELECT ${METRICS} ${filtered}`).bind(...scopeValues, start, end).first<PostingMetrics>(),
    db.prepare(`SELECT ${METRICS} ${filtered}`).bind(...scopeValues, prior, start).first<PostingMetrics>(),
    // LEFT JOIN keeps submissions with zero activity visible in the owner's list.
    db.prepare(`SELECT j.id,j.title,j.company,j.status,j.closing_at AS closingAt,j.created_at AS createdAt,${METRICS}
      FROM board_jobs j LEFT JOIN analytics_events e ON json_extract(e.properties,'$.jobId')=j.id AND ${events} AND e.received_at>=? AND e.received_at<?
      WHERE ${scope} GROUP BY j.id ORDER BY j.created_at DESC,j.id LIMIT ? OFFSET ?`)
      .bind(start, end, ...scopeValues, pageSize, (page - 1) * pageSize).all<PostingRow>(),
    db.prepare(`SELECT date(e.received_at,'-4 hours') AS day,${METRICS} ${filtered} GROUP BY day ORDER BY day`).bind(...scopeValues, start, end).all<{ day: string; briefs: number; clicks: number; sent: number }>(),
    db.prepare(`SELECT e.source AS label,COUNT(DISTINCT e.session_id) AS sessions ${filtered} AND e.origin='browser' GROUP BY e.source ORDER BY sessions DESC,label`).bind(...scopeValues, start, end).all<{ label: string; sessions: number }>(),
    db.prepare(`SELECT e.device AS label,COUNT(DISTINCT e.session_id) AS sessions ${filtered} AND e.origin='browser' GROUP BY e.device ORDER BY sessions DESC,label`).bind(...scopeValues, start, end).all<{ label: string; sessions: number }>(),
  ]);
  for (let t = now.getTime() - days * 86400_000; t <= now.getTime(); t += 86400_000) {
    const day = new Date(t - 4 * 3600_000).toISOString().slice(0, 10);
    const match = daily.results.find(row => row.day === day);
    base.daily.push({ day, briefs: match?.briefs || 0, clicks: match?.clicks || 0, sent: match?.sent || 0 });
  }
  return { ...base, current: current || { ...EMPTY }, previous: previous || { ...EMPTY }, jobs: jobs.results, sources: sources.results, devices: devices.results };
}

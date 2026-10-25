import type { D1Database } from "@/cloudflare-env";
import { reportDays } from "./model";

export type MetricRow = { label: string; events: number; sessions: number };
export type Summary = { sessions: number; pageviews: number; engaged: number; seconds: number; applyClicks: number; sent: number; profiles: number; submissions: number };
export type FunnelStep = { label: string; sessions: number };
export type AnalyticsReport = {
  days: number; startsAt: string; endsAt: string; current: Summary; previous: Summary;
  daily: { day: string; sessions: number; pageviews: number; applications: number }[];
  pages: MetricRow[]; sources: MetricRow[]; devices: MetricRow[]; events: MetricRow[];
  jobs: { id: string; title: string; briefs: number; clicks: number; sent: number }[];
  browserFunnel: FunnelStep[]; applicationFunnel: FunnelStep[]; employerFunnel: FunnelStep[];
};
const SUMMARY = `SELECT
  COUNT(DISTINCT CASE WHEN origin='browser' THEN session_id END) AS sessions,
  SUM(CASE WHEN name='page_view' THEN 1 ELSE 0 END) AS pageviews,
  COUNT(DISTINCT CASE WHEN name='page_engagement' THEN session_id END) AS engaged,
  COALESCE(SUM(CASE WHEN name='page_engagement' THEN json_extract(properties,'$.seconds') ELSE 0 END),0) AS seconds,
  SUM(CASE WHEN name='apply_click' THEN 1 ELSE 0 END) AS applyClicks,
  SUM(CASE WHEN name='application_sent' THEN 1 ELSE 0 END) AS sent,
  SUM(CASE WHEN name='profile_saved' THEN 1 ELSE 0 END) AS profiles,
  SUM(CASE WHEN name='job_submitted' THEN 1 ELSE 0 END) AS submissions
  FROM analytics_events WHERE received_at >= ? AND received_at < ?`;
const summary = (row: Partial<Summary> | null): Summary => Object.fromEntries(
  ["sessions", "pageviews", "engaged", "seconds", "applyClicks", "sent", "profiles", "submissions"].map(key => [key, Number(row?.[key as keyof Summary] || 0)])
) as Summary;

// Each stage is the first matching event after the preceding stage in the same session.
// Event times, rather than batch arrival order, preserve funnels across unload beacons.
async function funnel(db: D1Database, start: string, end: string, steps: { label: string; predicate: string }[]) {
  const ctes = [`base AS (SELECT * FROM analytics_events WHERE received_at >= ? AND received_at < ?)`];
  steps.forEach((step, i) => ctes.push(i === 0
    ? `s0 AS (SELECT session_id, MIN(occurred_at) AS at FROM base WHERE ${step.predicate} GROUP BY session_id)`
    : `s${i} AS (SELECT b.session_id, MIN(b.occurred_at) AS at FROM base b JOIN s${i - 1} p ON p.session_id=b.session_id AND b.occurred_at >= p.at WHERE ${step.predicate} GROUP BY b.session_id)`));
  const rows = await db.prepare(`WITH ${ctes.join(",")} ${steps.map((_, i) => `SELECT ${i} AS step, COUNT(*) AS sessions FROM s${i}`).join(" UNION ALL ")}`).bind(start, end).all<{ step: number; sessions: number }>();
  return steps.map((step, i) => ({ label: step.label, sessions: rows.results.find(r => r.step === i)?.sessions || 0 }));
}
export async function analyticsReport(db: D1Database, requestedDays = 30, now = new Date()): Promise<AnalyticsReport> {
  const days = reportDays(String(requestedDays));
  const end = now.toISOString(), start = new Date(now.getTime() - days * 86400_000).toISOString();
  const prior = new Date(now.getTime() - days * 2 * 86400_000).toISOString();
  const breakdown = (column: "path" | "name") => db.prepare(`SELECT ${column} AS label, COUNT(*) AS events, COUNT(DISTINCT session_id) AS sessions FROM analytics_events WHERE received_at >= ? AND received_at < ? ${column === "path" ? "AND name='page_view'" : ""} GROUP BY ${column} ORDER BY events DESC, label LIMIT 20`).bind(start, end).all<MetricRow>();
  const [current, previous, dailyRows, pages, events, dimensions, jobs, browserFunnel, applicationFunnel, employerFunnel] = await Promise.all([
    db.prepare(SUMMARY).bind(start, end).first<Summary>(), db.prepare(SUMMARY).bind(prior, start).first<Summary>(),
    db.prepare(`SELECT date(received_at, '-4 hours') AS day, COUNT(DISTINCT CASE WHEN origin='browser' THEN session_id END) AS sessions, SUM(name='page_view') AS pageviews, SUM(name='application_sent') AS applications FROM analytics_events WHERE received_at >= ? AND received_at < ? GROUP BY day ORDER BY day`).bind(start, end).all<{ day: string; sessions: number; pageviews: number; applications: number }>(),
    breakdown("path"), breakdown("name"),
    // Attribute a session once, using its first browser event in the selected window.
    db.prepare(`WITH first_events AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY occurred_at,sequence) AS n FROM analytics_events WHERE origin='browser' AND received_at >= ? AND received_at < ?)
      SELECT 'source' AS dimension, source AS label, COUNT(*) AS sessions FROM first_events WHERE n=1 GROUP BY source
      UNION ALL SELECT 'device' AS dimension, device AS label, COUNT(*) AS sessions FROM first_events WHERE n=1 GROUP BY device`).bind(start, end).all<{ dimension: string; label: string; sessions: number }>(),
    db.prepare(`SELECT json_extract(e.properties,'$.jobId') AS id, COALESCE(j.title, 'Unavailable listing') AS title, SUM(e.name='job_brief_open') AS briefs, SUM(e.name='apply_click') AS clicks, SUM(e.name='application_sent') AS sent
      FROM analytics_events e LEFT JOIN board_jobs j ON j.id=json_extract(e.properties,'$.jobId')
      WHERE e.received_at >= ? AND e.received_at < ? AND e.name IN ('job_brief_open','apply_click','application_sent') AND json_extract(e.properties,'$.jobId') IS NOT NULL
      GROUP BY json_extract(e.properties,'$.jobId') ORDER BY clicks DESC,briefs DESC,id LIMIT 20`).bind(start, end).all<{ id: string; title: string; briefs: number; clicks: number; sent: number }>(),
    funnel(db, start, end, [{ label: "Viewed the job board", predicate: "name='page_view' AND path IN ('/','/jobs')" }, { label: "Opened a brief", predicate: "name='job_brief_open'" }, { label: "Clicked apply", predicate: "name='apply_click'" }]),
    funnel(db, start, end, [{ label: "Viewed email application", predicate: "name='page_view' AND path='/jobs/:id/apply'" }, { label: "Started application", predicate: "name='form_start' AND json_extract(properties,'$.form')='application'" }, { label: "Previewed application", predicate: "name='application_preview'" }, { label: "Application accepted by email provider", predicate: "name='application_sent' AND origin='server'" }]),
    funnel(db, start, end, [{ label: "Viewed post a job", predicate: "name='page_view' AND path='/post-job'" }, { label: "Started job form", predicate: "name='form_start' AND json_extract(properties,'$.form')='job'" }, { label: "Job saved for review", predicate: "name='job_submitted' AND origin='server'" }]),
  ]);
  const daily = [];
  // Include both boundary days, because rolling windows can span days + 1 local dates.
  for (let t = now.getTime() - days * 86400_000; t <= now.getTime(); t += 86400_000) {
    const day = new Date(t - 4 * 3600_000).toISOString().slice(0, 10);
    daily.push(dailyRows.results.find(row => row.day === day) || { day, sessions: 0, pageviews: 0, applications: 0 });
  }
  const dimension = (type: string) => dimensions.results.filter(r => r.dimension === type).map(r => ({ label: r.label, events: r.sessions, sessions: r.sessions })).sort((a, b) => b.sessions - a.sessions);
  return { days, startsAt: start, endsAt: end, current: summary(current), previous: summary(previous), daily, pages: pages.results, events: events.results, sources: dimension("source"), devices: dimension("device"), jobs: jobs.results, browserFunnel, applicationFunnel, employerFunnel };
}
export function reportCsv(report: AnalyticsReport) {
  const cell = (value: string | number) => `"${String(value).replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""')}"`;
  const rows: (string | number)[][] = [["Section", "Label", "Events", "Sessions"]];
  for (const section of ["pages", "sources", "devices", "events"] as const) for (const row of report[section]) rows.push([section, row.label, row.events, row.sessions]);
  for (const row of report.daily) rows.push(["daily pageviews", row.day, row.pageviews, row.sessions]);
  for (const section of ["browserFunnel", "applicationFunnel", "employerFunnel"] as const) for (const row of report[section]) rows.push([section, row.label, "", row.sessions]);
  for (const row of report.jobs) rows.push(["job apply clicks", `${row.id}: ${row.title}`, row.clicks, ""]);
  return rows.map(row => row.map(cell).join(",")).join("\r\n");
}

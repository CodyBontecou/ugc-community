import type { D1Database } from "@/cloudflare-env";

export const AI_SOURCES = ["chatgpt", "perplexity", "claude", "copilot", "gemini"] as const;
export type AcquisitionRow = { period: string; source: string; entryPath: string; sessions: number; pageviews: number; applyClicks: number; applicationsSent: number; jobSubmissions: number };

export async function aiAcquisitionReport(db: D1Database, now = new Date()) {
  const localDay = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Puerto_Rico", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const midnight = new Date(`${localDay}T00:00:00-04:00`);
  const ago = (days: number) => new Date(midnight.getTime() - days * 86400_000).toISOString();
  const periods = [
    { label: "previous7", startsAt: ago(14), endsAt: ago(7), complete: true },
    { label: "last7", startsAt: ago(7), endsAt: midnight.toISOString(), complete: true },
    { label: "today", startsAt: midnight.toISOString(), endsAt: now.toISOString(), complete: false },
  ];
  const [coverage, rows] = await Promise.all([
    db.prepare("SELECT MIN(received_at) AS firstEventAt, MAX(received_at) AS lastEventAt, COUNT(*) AS retainedEvents FROM analytics_events").first<{ firstEventAt: string | null; lastEventAt: string | null; retainedEvents: number }>(),
    db.prepare(`WITH periods(period, starts, ends) AS (VALUES ('previous7',?,?),('last7',?,?),('today',?,?)),
      events AS (SELECT p.period, e.* FROM analytics_events e JOIN periods p ON e.received_at >= p.starts AND e.received_at < p.ends),
      ranked AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY period, session_id ORDER BY occurred_at, sequence) AS n FROM events WHERE origin='browser'),
      entries AS (SELECT period, session_id, source, path FROM ranked WHERE n=1)
      SELECT a.period, a.source, a.path AS entryPath, COUNT(DISTINCT a.session_id) AS sessions,
        SUM(e.name='page_view') AS pageviews, SUM(e.name='apply_click') AS applyClicks,
        SUM(e.name='application_sent' AND e.origin='server') AS applicationsSent,
        SUM(e.name='job_submitted' AND e.origin='server') AS jobSubmissions
      FROM entries a JOIN events e ON e.period=a.period AND e.session_id=a.session_id
      GROUP BY a.period,a.source,a.path ORDER BY a.period,a.source,a.path`)
      .bind(...periods.flatMap(p => [p.startsAt, p.endsAt])).all<AcquisitionRow>(),
  ]);
  const metrics = (items: AcquisitionRow[]) => items.reduce((sum, r) => ({ sessions: sum.sessions + r.sessions, pageviews: sum.pageviews + r.pageviews, applyClicks: sum.applyClicks + r.applyClicks, applicationsSent: sum.applicationsSent + r.applicationsSent, jobSubmissions: sum.jobSubmissions + r.jobSubmissions }), { sessions: 0, pageviews: 0, applyClicks: 0, applicationsSent: 0, jobSubmissions: 0 });
  return {
    generatedAt: now.toISOString(), timezone: "America/Puerto_Rico", available: true, coverage,
    periods: periods.map(p => ({ ...p, allTraffic: metrics(rows.results.filter(r => r.period === p.label)), aiTraffic: metrics(rows.results.filter(r => r.period === p.label && AI_SOURCES.includes(r.source as typeof AI_SOURCES[number]))), byAssistant: AI_SOURCES.map(source => ({ source, ...metrics(rows.results.filter(r => r.period === p.label && r.source === source)) })) })),
    aiEntries: rows.results.filter(r => AI_SOURCES.includes(r.source as typeof AI_SOURCES[number])),
    limitations: ["Consented measured sessions, not people or all visits. No historical backfill.", "Attribution comes from the first tracked browser event in each window; a session may have begun earlier.", "Referrers and recognized UTM tags are reported source labels, not proof of an assistant citation. Google/Bing traffic is not attributed to an AI product.", "Consent refusal, privacy signals, blocked scripts, missing referrers/tags, and collection failures reduce coverage.", "Application sends are provider acceptance, not hires or completed external applications. Today's partial totals are separate from complete-day comparisons."],
  };
}

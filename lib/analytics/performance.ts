import type { D1Database } from "@/cloudflare-env";
export async function performanceReport(db: D1Database, start: string, end: string) {
  const rows = await db.prepare(`WITH samples AS (
    SELECT json_extract(properties,'$.metric') AS metric, json_extract(properties,'$.value') AS value,
      ROW_NUMBER() OVER (PARTITION BY session_id, path, json_extract(properties,'$.sample') ORDER BY occurred_at DESC, sequence DESC) AS latest
    FROM analytics_events WHERE name='web_vital' AND origin='browser' AND received_at>=? AND received_at<?
  ), ranked AS (SELECT metric,value,ROW_NUMBER() OVER (PARTITION BY metric ORDER BY value) AS position,COUNT(*) OVER (PARTITION BY metric) AS samples FROM samples WHERE latest=1)
  SELECT metric,MAX(samples) AS samples,MIN(CASE WHEN position>=((samples*75+99)/100) THEN value END) AS p75 FROM ranked GROUP BY metric ORDER BY metric`).bind(start,end).all<{ metric: string; samples: number; p75: number }>();
  return rows.results;
}

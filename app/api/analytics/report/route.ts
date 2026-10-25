import { boardAdmin } from "@/lib/job-board/access";
import { analyticsDatabase } from "@/lib/analytics/server";
import { analyticsReport, reportCsv } from "@/lib/analytics/report";
import { reportDays } from "@/lib/analytics/model";
export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie" };
  if (!await boardAdmin()) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  try {
    const url = new URL(request.url);
    const report = await analyticsReport(await analyticsDatabase(), reportDays(url.searchParams.get("days")));
    if (url.searchParams.get("format") === "csv") return new Response(reportCsv(report), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="ugc-analytics.csv"' } });
    return Response.json(report, { headers });
  } catch { return Response.json({ error: "Analytics unavailable. Check the JOB_BOARD binding and analytics migration." }, { status: 503, headers }); }
}

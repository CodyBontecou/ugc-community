import { posterSession, PosterAccessError } from "@/lib/analytics/poster-access";
import { analyticsDatabase } from "@/lib/analytics/server";
import { postingReport, postingPage, PostingNotFound } from "@/lib/analytics/postings";
import { reportDays } from "@/lib/analytics/model";
export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  try {
    const user = await posterSession();
    const params = new URL(request.url).searchParams;
    const jobId = params.get("job");
    if (jobId && jobId.length > 100) return Response.json({ error: "Posting not found" }, { status: 404, headers });
    const report = await postingReport(await analyticsDatabase(), user.id, { days: reportDays(params.get("days")), jobId, page: postingPage(params.get("page")) });
    return Response.json(report, { headers });
  } catch (error) {
    if (error instanceof PosterAccessError) return Response.json({ error: error.message }, { status: error.status, headers });
    if (error instanceof PostingNotFound) return Response.json({ error: "Posting not found" }, { status: 404, headers });
    return Response.json({ error: "Posting analytics is temporarily unavailable" }, { status: 503, headers });
  }
}

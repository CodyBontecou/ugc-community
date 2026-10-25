import { boardBindings } from "@/lib/job-board/access";
import { refreshTargets } from "@/lib/job-board/refresh-targets";
export const dynamic = "force-dynamic";

// Only URLs of previously public jobs are exposed, including those awaiting
// rereview after an edit or freshness expiry. No source body or submitter data.
export async function GET() {
  try {
    return Response.json(await refreshTargets((await boardBindings()).JOB_BOARD), {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch {
    return Response.json({ error: "Refresh targets unavailable" }, { status: 503 });
  }
}

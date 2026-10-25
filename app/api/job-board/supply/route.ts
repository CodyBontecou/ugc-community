import { boardAdmin, boardBindings } from "@/lib/job-board/access";
import { supplyReport } from "@/lib/job-board/search";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!await boardAdmin()) return Response.json({ error: "Admin access required" }, { status: 403 });
  try {
    const report = await supplyReport((await boardBindings()).JOB_BOARD);
    return Response.json(report, { headers: { "Cache-Control": "private, no-store", "Content-Disposition": 'attachment; filename="ugc-job-supply.json"' } });
  } catch { return Response.json({ error: "Report unavailable" }, { status: 503 }); }
}

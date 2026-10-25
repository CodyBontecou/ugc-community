import { boardAdmin, boardBindings } from "@/lib/job-board/access";
import { syncJobBoard } from "@/lib/job-board/sync";
import { sameOrigin } from "@/lib/job-board/http";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (!await boardAdmin()) return Response.json({ error: "Admin access required" }, { status: 403 });
  try { return Response.json(await syncJobBoard(await boardBindings())); }
  catch { return Response.json({ error: "Sync unavailable; the next scheduled scan will retry" }, { status: 503 }); }
}

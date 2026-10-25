import { boardAdmin, boardBindings } from "@/lib/job-board/access";
import { reviewSchema } from "@/lib/job-board/review-schema";
import { reviewJob } from "@/lib/job-board/store";
import { readBody, sameOrigin } from "@/lib/job-board/http";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (!await boardAdmin()) return Response.json({ error: "Admin access required" }, { status: 403 });
  let input: unknown;
  try { input = await readBody(request); } catch { return Response.json({ error: "Invalid or oversized request" }, { status: 400 }); }
  const result = reviewSchema.safeParse(input);
  if (!result.success) return Response.json({ error: "Invalid review fields" }, { status: 400 });
  try { await reviewJob((await boardBindings()).JOB_BOARD, result.data); return Response.json({ success: true }); }
  catch (error) {
    const message = error instanceof Error ? error.message : "Review failed";
    const known = /^(Listing |Confirm |Closing |Cash |Direct |Full |Campaign |External )/.test(message);
    return Response.json({ error: known ? message : "Could not save review; reload and retry" }, { status: known ? 409 : 503 });
  }
}

import { z } from "zod";
import { boardAdmin, boardBindings } from "@/lib/job-board/access";
import { PAY_TYPES } from "@/lib/job-board/model";
import { reviewJob } from "@/lib/job-board/store";
import { readBody, sameOrigin } from "@/lib/job-board/http";
const schema = z.object({
  id: z.string().min(1).max(100), expectedUpdatedAt: z.iso.datetime(), action: z.enum(["publish", "reject", "close"]),
  company: z.string().max(160), title: z.string().max(200), description: z.string().max(12_000),
  compensationType: z.enum(PAY_TYPES), compensationText: z.string().max(2000), cashAmount: z.number().positive().max(10_000_000).nullable(),
  deliverables: z.string().max(3000), eligibility: z.string().max(3000), usageRights: z.string().max(3000),
  applicationUrl: z.string().max(2000), closingAt: z.iso.datetime().nullable(), campaignKey: z.string().max(200),
  notes: z.string().max(3000), verified: z.boolean(),
});
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (!await boardAdmin()) return Response.json({ error: "Admin access required" }, { status: 403 });
  let input: unknown;
  try { input = await readBody(request); } catch { return Response.json({ error: "Invalid or oversized request" }, { status: 400 }); }
  const result = schema.safeParse(input);
  if (!result.success) return Response.json({ error: "Invalid review fields" }, { status: 400 });
  try { await reviewJob((await boardBindings()).JOB_BOARD, result.data); return Response.json({ success: true }); }
  catch (error) {
    const message = error instanceof Error ? error.message : "Review failed";
    const known = /^(Listing |Confirm |Closing |Cash |Direct |Full |Campaign |External )/.test(message);
    return Response.json({ error: known ? message : "Could not save review; reload and retry" }, { status: known ? 409 : 503 });
  }
}

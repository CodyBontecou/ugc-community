import { getServerSession } from "@/lib/auth/session";
import { boardBindings } from "@/lib/job-board/access";
import { submissionSchema } from "@/lib/job-board/model";
import { submitDirectJob } from "@/lib/job-board/store";
import { readBody, sameOrigin } from "@/lib/job-board/http";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  let input: unknown;
  try { input = await readBody(request); } catch { return Response.json({ error: "Invalid or oversized request" }, { status: 400 }); }
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Complete all required fields" }, { status: 400 });
  try {
    const session = await getServerSession();
    const network = request.headers.get("cf-connecting-ip") || "local-preview";
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${process.env.BETTER_AUTH_SECRET || "local-preview"}:${network}`));
    const networkId = [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
    const { JOB_BOARD } = await boardBindings();
    const id = await submitDirectJob(JOB_BOARD, parsed.data, { id: session?.user.id || `anonymous:${networkId}`, email: parsed.data.contactEmail });
    return Response.json({ id, status: "pending_review" }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Daily submission limit reached") return Response.json({ error: error.message }, { status: 429 });
    return Response.json({ error: "Could not save your job. Please try again." }, { status: 503 });
  }
}

import { recordOutcome } from "@/lib/analytics/server";
import { z } from "zod";
import { applicantSession } from "@/lib/job-board/applicant-access";
import { boardBindings } from "@/lib/job-board/access";
import { ApplicationError, submitApplication } from "@/lib/job-board/applications";
import { sendApplicationEmail } from "@/lib/job-board/application-email";
import { readBody, sameOrigin } from "@/lib/job-board/http";
export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const user = await applicantSession();
    const application = await submitApplication((await boardBindings()).JOB_BOARD, user, (await context.params).jobId, await readBody(request, 16_000), sendApplicationEmail);
    if (application.status === "sent") await recordOutcome(request, "application_sent", "/jobs/:id/apply", { jobId: (await context.params).jobId }, application.id);
    return Response.json({ id: application.id, status: application.status });
  } catch (error) {
    if (error instanceof ApplicationError) return Response.json({ error: error.message, retryable: error.retryable }, { status: error.status });
    if (error instanceof z.ZodError) return Response.json({ error: error.issues[0]?.message }, { status: 400 });
    return Response.json({ error: "Could not confirm your application. Please try again." }, { status: 503 });
  }
}

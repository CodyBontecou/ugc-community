import { recordOutcome } from "@/lib/analytics/server";
import { z } from "zod";
import { applicantSession } from "@/lib/job-board/applicant-access";
import { boardBindings } from "@/lib/job-board/access";
import { ApplicationError } from "@/lib/job-board/applications";
import { readBody, sameOrigin } from "@/lib/job-board/http";
import { saveCreatorProfile } from "@/lib/job-board/profiles";
export async function PUT(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const user = await applicantSession();
    if (!user.emailVerified) throw new ApplicationError("Verify your email before generating a profile", 403);
    const saved = await saveCreatorProfile((await boardBindings()).JOB_BOARD, user.id, await readBody(request, 20_000));
    await recordOutcome(request, "profile_saved", "/apply-profile", {});
    return Response.json(saved);
  } catch (error) {
    if (error instanceof ApplicationError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof z.ZodError) return Response.json({ error: error.issues[0]?.message }, { status: 400 });
    return Response.json({ error: "Could not save your profile. Please try again." }, { status: 503 });
  }
}

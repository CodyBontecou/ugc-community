import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getJobById } from "@/lib/jobs/queries";
import { listJobHooks } from "@/lib/jobs/hook-queries";

// GET /api/jobs/[jobId]/hooks - List hooks for a published job (creator-facing)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    await requireAuth(); // Must be logged in

    const { jobId } = await params;
    const result = await getJobById(jobId);

    if (!result) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const hooks = await listJobHooks(jobId);
    return NextResponse.json({ hooks });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing job hooks:", error);
    return NextResponse.json({ error: "Failed to list hooks" }, { status: 500 });
  }
}

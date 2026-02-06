import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getJobById, incrementJobViewCount } from "@/lib/jobs/queries";

// GET /api/jobs/[jobId] - Get job detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const result = await getJobById(jobId);

    if (!result) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Only allow viewing active jobs (or if user is admin - handled elsewhere)
    if (result.job.status !== "active") {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Increment view count (fire and forget)
    incrementJobViewCount(jobId).catch(console.error);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error getting job:", error);
    return NextResponse.json({ error: "Failed to get job" }, { status: 500 });
  }
}

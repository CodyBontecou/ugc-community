import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { createJobApplication, getJobById } from "@/lib/jobs/queries";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isBrand } from "@/lib/roles";

// POST /api/jobs/[jobId]/apply - Creator opts in to a job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a creator (not a brand)
    const user = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (isBrand(user[0]?.role)) {
      return NextResponse.json(
        { error: "Only creators can apply to jobs" },
        { status: 403 }
      );
    }

    const { jobId } = await params;

    // Verify job exists and is active
    const jobResult = await getJobById(jobId);
    if (!jobResult || jobResult.job.status !== "active") {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Parse optional note from request body
    let note: string | undefined;
    try {
      const body = await request.json();
      note = body.note;
    } catch {
      // No body or invalid JSON is fine
    }

    // Create application (will be ignored if already exists)
    const application = await createJobApplication(jobId, session.user.id, note);

    if (!application) {
      return NextResponse.json(
        { message: "Already applied to this job" },
        { status: 200 }
      );
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Error applying to job:", error);
    return NextResponse.json({ error: "Failed to apply to job" }, { status: 500 });
  }
}

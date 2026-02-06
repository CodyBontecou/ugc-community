import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { getJobById, updateJob, deleteJob } from "@/lib/jobs/queries";

// GET /api/admin/jobs/[jobId] - Get job detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { jobId } = await params;
    const result = await getJobById(jobId);

    if (!result) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error getting job:", error);
    return NextResponse.json({ error: "Failed to get job" }, { status: 500 });
  }
}

// PATCH /api/admin/jobs/[jobId] - Update job
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { jobId } = await params;
    const body = await request.json();

    // Check job exists
    const existing = await getJobById(jobId);
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = await updateJob(jobId, {
      title: body.title,
      description: body.description,
      hooks: body.hooks,
      compensationType: body.compensationType,
      compensationDetails: body.compensationDetails,
      niches: body.niches,
      platforms: body.platforms,
      status: body.status,
      brandId: body.brandId,
      isFeatured: body.isFeatured,
      deadlineAt: body.deadlineAt ? new Date(body.deadlineAt) : body.deadlineAt,
    });

    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating job:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

// DELETE /api/admin/jobs/[jobId] - Delete job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { jobId } = await params;

    // Check job exists
    const existing = await getJobById(jobId);
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await deleteJob(jobId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting job:", error);
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}

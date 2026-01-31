import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getBrandJobById, updateJob, deleteJob, getJobApplications } from "@/lib/jobs/queries";

// GET /api/brand/jobs/[jobId] - Get job detail with applications
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireAuth();

    if (session.user.role !== "brand") {
      return NextResponse.json({ error: "Brand access required" }, { status: 403 });
    }

    const { jobId } = await params;
    const result = await getBrandJobById(jobId, session.user.id);

    if (!result) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get applications for this job
    const applications = await getJobApplications(jobId);

    return NextResponse.json({
      ...result,
      applications,
      currentUserId: session.user.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error getting brand job:", error);
    return NextResponse.json({ error: "Failed to get job" }, { status: 500 });
  }
}

// PATCH /api/brand/jobs/[jobId] - Update job (limited fields)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireAuth();

    if (session.user.role !== "brand") {
      return NextResponse.json({ error: "Brand access required" }, { status: 403 });
    }

    const { jobId } = await params;
    const body = await request.json();

    // Check job exists and belongs to this brand
    const existing = await getBrandJobById(jobId, session.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const currentStatus = existing.job.status;

    // Determine what status transitions are allowed
    let newStatus = body.status;
    if (newStatus) {
      // Brands cannot set status to "active" - that's admin-only
      if (newStatus === "active") {
        return NextResponse.json(
          { error: "Cannot set status to active. Jobs must be approved by admin." },
          { status: 400 }
        );
      }

      // Status transition rules:
      // - draft -> pending_review (submit for review)
      // - pending_review -> draft (withdraw for edits)
      // - active -> paused, closed (brand can pause/close their active jobs)
      // - paused -> active is NOT allowed (must go through admin re-approval)
      // - paused -> closed is allowed
      const allowedTransitions: Record<string, string[]> = {
        draft: ["pending_review"],
        pending_review: ["draft"], // Withdraw to make edits
        active: ["paused", "closed"],
        paused: ["closed"], // Cannot reactivate without admin approval
        closed: [], // Cannot reopen
      };

      if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
        return NextResponse.json(
          { error: `Cannot change status from ${currentStatus} to ${newStatus}` },
          { status: 400 }
        );
      }
    }

    // Brands cannot modify certain fields
    const job = await updateJob(jobId, {
      title: body.title,
      description: body.description,
      hooks: body.hooks,
      compensationType: body.compensationType,
      compensationDetails: body.compensationDetails,
      niches: body.niches,
      platforms: body.platforms,
      status: newStatus,
      // Note: isFeatured and brandId are NOT updatable by brands
      deadlineAt: body.deadlineAt ? new Date(body.deadlineAt) : body.deadlineAt,
    });

    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating brand job:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

// DELETE /api/brand/jobs/[jobId] - Delete draft/pending jobs only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireAuth();

    if (session.user.role !== "brand") {
      return NextResponse.json({ error: "Brand access required" }, { status: 403 });
    }

    const { jobId } = await params;

    // Check job exists and belongs to this brand
    const existing = await getBrandJobById(jobId, session.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Only allow deletion of draft or pending_review jobs
    const deletableStatuses = ["draft", "pending_review"];
    if (!deletableStatuses.includes(existing.job.status)) {
      return NextResponse.json(
        { error: "Can only delete draft or pending review jobs. Close the job instead." },
        { status: 400 }
      );
    }

    await deleteJob(jobId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting brand job:", error);
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}

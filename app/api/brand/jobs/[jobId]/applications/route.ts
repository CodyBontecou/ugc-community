import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getBrandJobById, getJobApplications } from "@/lib/jobs/queries";

// GET /api/brand/jobs/[jobId]/applications - List applications for a brand's job
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

    // Verify job belongs to this brand
    const job = await getBrandJobById(jobId, session.user.id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get applications with creator info (excludes sensitive data like email)
    const applications = await getJobApplications(jobId);

    return NextResponse.json({ applications });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching job applications:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

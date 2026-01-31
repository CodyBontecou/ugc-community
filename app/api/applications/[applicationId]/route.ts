import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { jobApplications, contentJobs, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/applications/[applicationId] - Get application details for creator
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId } = await params;

    // Get application - verify creator owns it
    const [application] = await db
      .select({
        id: jobApplications.id,
        jobId: jobApplications.jobId,
        creatorId: jobApplications.creatorId,
        status: jobApplications.status,
        note: jobApplications.note,
        createdAt: jobApplications.createdAt,
        updatedAt: jobApplications.updatedAt,
      })
      .from(jobApplications)
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check if user is the creator who owns this application
    // or the brand who owns the job
    const [job] = await db
      .select({
        id: contentJobs.id,
        title: contentJobs.title,
        description: contentJobs.description,
        hooks: contentJobs.hooks,
        compensationType: contentJobs.compensationType,
        compensationDetails: contentJobs.compensationDetails,
        status: contentJobs.status,
        deadlineAt: contentJobs.deadlineAt,
        brandId: contentJobs.brandId,
      })
      .from(contentJobs)
      .where(eq(contentJobs.id, application.jobId))
      .limit(1);

    const isCreator = application.creatorId === session.user.id;
    const isBrandOwner = job?.brandId === session.user.id;

    if (!isCreator && !isBrandOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get brand info
    let brand = null;
    if (job?.brandId) {
      const [brandUser] = await db
        .select({
          id: users.id,
          name: users.name,
          displayName: users.displayName,
          image: users.image,
        })
        .from(users)
        .where(eq(users.id, job.brandId))
        .limit(1);
      brand = brandUser || null;
    }

    return NextResponse.json({
      application: {
        ...application,
        job: {
          ...job,
          brand,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }
}

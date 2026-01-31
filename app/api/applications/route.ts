import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { jobApplications, contentJobs, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { isCreator } from "@/lib/roles";

// GET /api/applications - Get creator's job applications
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a creator
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!isCreator(user?.role)) {
      return NextResponse.json({ error: "Only creators can view applications" }, { status: 403 });
    }

    // Get all applications with job and brand info
    const applications = await db
      .select({
        id: jobApplications.id,
        jobId: jobApplications.jobId,
        status: jobApplications.status,
        note: jobApplications.note,
        createdAt: jobApplications.createdAt,
        updatedAt: jobApplications.updatedAt,
        job: {
          id: contentJobs.id,
          title: contentJobs.title,
          description: contentJobs.description,
          compensationType: contentJobs.compensationType,
          compensationDetails: contentJobs.compensationDetails,
          status: contentJobs.status,
        },
      })
      .from(jobApplications)
      .innerJoin(contentJobs, eq(jobApplications.jobId, contentJobs.id))
      .where(eq(jobApplications.creatorId, session.user.id))
      .orderBy(desc(jobApplications.updatedAt));

    // Get brand info for each job
    const applicationWithBrands = await Promise.all(
      applications.map(async (app) => {
        const [job] = await db
          .select({ brandId: contentJobs.brandId })
          .from(contentJobs)
          .where(eq(contentJobs.id, app.job.id))
          .limit(1);

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

        return {
          ...app,
          job: {
            ...app.job,
            brand,
          },
          unreadMessageCount: 0, // TODO: Calculate unread messages
        };
      })
    );

    return NextResponse.json({ applications: applicationWithBrands });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { contentJobs, jobApplications, users, applicationMessages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isBrand } from "@/lib/roles";
import { createNotification } from "@/lib/notifications/queries";
import { sendApplicationStatusEmail } from "@/lib/email";
import type { ApplicationStatus } from "@/lib/jobs/constants";

// PATCH /api/brand/jobs/[jobId]/applications/[applicationId] - Update application status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; applicationId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a brand
    const [user] = await db
      .select({ role: users.role, name: users.name })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!isBrand(user?.role)) {
      return NextResponse.json({ error: "Only brands can update applications" }, { status: 403 });
    }

    const { jobId, applicationId } = await params;

    // Verify brand owns this job
    const [job] = await db
      .select({ id: contentJobs.id, title: contentJobs.title, brandId: contentJobs.brandId })
      .from(contentJobs)
      .where(eq(contentJobs.id, jobId))
      .limit(1);

    if (!job || job.brandId !== session.user.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get the application with creator info
    const [application] = await db
      .select({
        id: jobApplications.id,
        creatorId: jobApplications.creatorId,
        status: jobApplications.status,
      })
      .from(jobApplications)
      .where(and(eq(jobApplications.id, applicationId), eq(jobApplications.jobId, jobId)))
      .limit(1);

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { status, message } = body as {
      status: "accepted" | "rejected" | "info_requested";
      message?: string;
    };

    if (!["accepted", "rejected", "info_requested"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update application status
    const [updatedApplication] = await db
      .update(jobApplications)
      .set({
        status: status as ApplicationStatus,
        updatedAt: new Date(),
      })
      .where(eq(jobApplications.id, applicationId))
      .returning();

    // If there's a message, create it
    if (message && message.trim()) {
      await db.insert(applicationMessages).values({
        applicationId,
        senderId: session.user.id,
        message: message.trim(),
      });
    }

    // Get creator info for notification and email
    const [creator] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailOnApplicationUpdate: users.emailOnApplicationUpdate,
      })
      .from(users)
      .where(eq(users.id, application.creatorId))
      .limit(1);

    if (creator) {
      // Create notification for creator
      const notificationTitles = {
        accepted: `${user.name || "A brand"} accepted your application`,
        rejected: `Application update for "${job.title}"`,
        info_requested: `${user.name || "A brand"} has a question`,
      };

      const notificationMessages = {
        accepted: `Congratulations! You've been selected for "${job.title}".`,
        rejected: `The brand has decided to go in a different direction for "${job.title}".`,
        info_requested: message || `They'd like more information about your application for "${job.title}".`,
      };

      await createNotification({
        userId: creator.id,
        type: status === "accepted"
          ? "application_accepted"
          : status === "rejected"
          ? "application_rejected"
          : "application_info_requested",
        title: notificationTitles[status],
        message: notificationMessages[status],
        link: `/dashboard/applications/${applicationId}`,
        metadata: {
          jobId: job.id,
          jobTitle: job.title,
          applicationId,
          brandId: session.user.id,
          brandName: user.name || undefined,
        },
      });

      // Send email if creator has enabled notifications
      if (creator.emailOnApplicationUpdate) {
        try {
          await sendApplicationStatusEmail({
            creatorName: creator.name || "Creator",
            creatorEmail: creator.email,
            brandName: user.name || "A brand",
            jobTitle: job.title,
            status,
            message: message || undefined,
            applicationId,
          });
        } catch (emailError) {
          console.error("Failed to send application status email:", emailError);
          // Don't fail the request if email fails
        }
      }
    }

    return NextResponse.json({ application: updatedApplication });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

// GET /api/brand/jobs/[jobId]/applications/[applicationId] - Get application details with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; applicationId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a brand
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!isBrand(user?.role)) {
      return NextResponse.json({ error: "Only brands can view application details" }, { status: 403 });
    }

    const { jobId, applicationId } = await params;

    // Verify brand owns this job
    const [job] = await db
      .select({ id: contentJobs.id, brandId: contentJobs.brandId })
      .from(contentJobs)
      .where(eq(contentJobs.id, jobId))
      .limit(1);

    if (!job || job.brandId !== session.user.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get application with creator info
    const [application] = await db
      .select({
        id: jobApplications.id,
        jobId: jobApplications.jobId,
        creatorId: jobApplications.creatorId,
        status: jobApplications.status,
        note: jobApplications.note,
        createdAt: jobApplications.createdAt,
        updatedAt: jobApplications.updatedAt,
        creator: {
          id: users.id,
          name: users.name,
          displayName: users.displayName,
          image: users.image,
          subdomain: users.subdomain,
          niches: users.niches,
          tagline: users.tagline,
        },
      })
      .from(jobApplications)
      .innerJoin(users, eq(jobApplications.creatorId, users.id))
      .where(and(eq(jobApplications.id, applicationId), eq(jobApplications.jobId, jobId)))
      .limit(1);

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Get messages
    const messages = await db
      .select({
        id: applicationMessages.id,
        message: applicationMessages.message,
        createdAt: applicationMessages.createdAt,
        sender: {
          id: users.id,
          name: users.name,
          displayName: users.displayName,
          image: users.image,
        },
      })
      .from(applicationMessages)
      .innerJoin(users, eq(applicationMessages.senderId, users.id))
      .where(eq(applicationMessages.applicationId, applicationId))
      .orderBy(applicationMessages.createdAt);

    return NextResponse.json({ application, messages });
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }
}

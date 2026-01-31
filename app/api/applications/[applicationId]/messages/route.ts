import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { jobApplications, applicationMessages, users, contentJobs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createNotification } from "@/lib/notifications/queries";

// GET /api/applications/[applicationId]/messages - Get messages for an application
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

    // Get the application to verify access
    const [application] = await db
      .select({
        id: jobApplications.id,
        creatorId: jobApplications.creatorId,
        jobId: jobApplications.jobId,
      })
      .from(jobApplications)
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Get the job to check if user is the brand
    const [job] = await db
      .select({ brandId: contentJobs.brandId })
      .from(contentJobs)
      .where(eq(contentJobs.id, application.jobId))
      .limit(1);

    // Verify user is either the creator or the brand
    const isCreator = application.creatorId === session.user.id;
    const isBrandOwner = job?.brandId === session.user.id;

    if (!isCreator && !isBrandOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
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

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST /api/applications/[applicationId]/messages - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId } = await params;
    const body = await request.json();
    const { message } = body as { message: string };

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get the application to verify access
    const [application] = await db
      .select({
        id: jobApplications.id,
        creatorId: jobApplications.creatorId,
        jobId: jobApplications.jobId,
      })
      .from(jobApplications)
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Get the job to check if user is the brand
    const [job] = await db
      .select({
        brandId: contentJobs.brandId,
        title: contentJobs.title,
      })
      .from(contentJobs)
      .where(eq(contentJobs.id, application.jobId))
      .limit(1);

    // Verify user is either the creator or the brand
    const isCreator = application.creatorId === session.user.id;
    const isBrandOwner = job?.brandId === session.user.id;

    if (!isCreator && !isBrandOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get sender info
    const [sender] = await db
      .select({ name: users.name, displayName: users.displayName })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    // Create the message
    const [newMessage] = await db
      .insert(applicationMessages)
      .values({
        applicationId,
        senderId: session.user.id,
        message: message.trim(),
      })
      .returning();

    // Notify the other party
    const recipientId = isCreator ? job?.brandId : application.creatorId;
    if (recipientId) {
      const senderName = sender?.displayName || sender?.name || "Someone";

      await createNotification({
        userId: recipientId,
        type: "new_message",
        title: `New message from ${senderName}`,
        message: message.trim().substring(0, 100) + (message.length > 100 ? "..." : ""),
        link: isCreator
          ? `/dashboard/brand-jobs/${application.jobId}?tab=applications&expand=${applicationId}`
          : `/dashboard/applications/${applicationId}`,
        metadata: {
          jobId: application.jobId,
          jobTitle: job?.title,
          applicationId,
          messageId: newMessage.id,
        },
      });
    }

    return NextResponse.json({
      message: {
        ...newMessage,
        sender: {
          id: session.user.id,
          name: sender?.name || null,
          displayName: sender?.displayName || null,
          image: null,
        },
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

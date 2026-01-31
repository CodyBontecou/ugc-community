import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users, invites, waitlist } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

const convertInviteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  instagramHandles: z.array(z.string()).optional(),
  tiktokHandles: z.array(z.string()).optional(),
  youtubeHandles: z.array(z.string()).optional(),
  twitterHandles: z.array(z.string()).optional(),
});

// POST /api/admin/invites/[inviteId]/convert - Convert an invite to a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { inviteId } = await params;
    const body = await request.json();
    const validatedData = convertInviteSchema.parse(body);

    // Get the invite
    const invite = await db.query.invites.findFirst({
      where: eq(invites.id, inviteId),
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Check if invite is valid for conversion
    if (invite.usedAt) {
      return NextResponse.json(
        { error: "This invite has already been used" },
        { status: 400 }
      );
    }

    if (invite.revokedAt) {
      return NextResponse.json(
        { error: "This invite has been revoked" },
        { status: 400 }
      );
    }

    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      );
    }

    if (!invite.email) {
      return NextResponse.json(
        { error: "Cannot convert an invite without an email address" },
        { status: 400 }
      );
    }

    // Check if a user with this email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, invite.email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Get social handles from waitlist if available
    const waitlistEntry = await db.query.waitlist.findFirst({
      where: eq(waitlist.email, invite.email),
    });

    // Clean social handles helper
    const cleanHandles = (handles: string[] | undefined | null): string[] | null => {
      if (!handles || handles.length === 0) return null;
      const cleaned = handles
        .map((h) => h.trim().replace(/^@/, ""))
        .filter((h) => h.length > 0);
      return cleaned.length > 0 ? cleaned : null;
    };

    // Merge social handles from waitlist and request
    const instagramHandles = cleanHandles(validatedData.instagramHandles) ||
      (waitlistEntry?.instagramHandle ? [waitlistEntry.instagramHandle] : null);
    const tiktokHandles = cleanHandles(validatedData.tiktokHandles) ||
      (waitlistEntry?.tiktokHandle ? [waitlistEntry.tiktokHandle] : null);
    const youtubeHandles = cleanHandles(validatedData.youtubeHandles) ||
      (waitlistEntry?.youtubeHandle ? [waitlistEntry.youtubeHandle] : null);
    const twitterHandles = cleanHandles(validatedData.twitterHandles) ||
      (waitlistEntry?.twitterHandle ? [waitlistEntry.twitterHandle] : null);

    // Create the user
    const userId = nanoid();
    const now = new Date();

    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        name: validatedData.name,
        email: invite.email,
        emailVerified: true, // Admin-created accounts are trusted
        displayName: validatedData.displayName || null,
        bio: validatedData.bio || null,
        role: invite.role || "creator",
        status: "active",
        instagramHandles,
        tiktokHandles,
        youtubeHandles,
        twitterHandles,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        displayName: users.displayName,
        createdAt: users.createdAt,
      });

    // Mark invite as used
    await db
      .update(invites)
      .set({
        usedAt: now,
        usedBy: userId,
      })
      .where(eq(invites.id, inviteId));

    return NextResponse.json({
      success: true,
      user: newUser,
      message: `User "${newUser.name}" created successfully. They can sign in using Google OAuth with ${invite.email}.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error converting invite:", error);
    return NextResponse.json(
      { error: "Failed to convert invite to user" },
      { status: 500 }
    );
  }
}

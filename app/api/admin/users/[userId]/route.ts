import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin, type UserStatus } from "@/lib/admin";
import { db } from "@/lib/db";
import { users, invites } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";
import { validateSubdomain } from "@/lib/validation/subdomain";

const updateUserStatusSchema = z.object({
  status: z.enum(["active", "suspended", "banned"]),
});

const updateUserSubdomainSchema = z.object({
  subdomain: z.string().nullable(),
});

// GET /api/admin/users/[userId] - Get user details with invite history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId } = await params;

    // Get user details
    const userResult = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        image: users.image,
        username: users.username,
        displayName: users.displayName,
        bio: users.bio,
        websiteUrl: users.websiteUrl,
        instagramHandle: users.instagramHandle,
        tiktokHandle: users.tiktokHandle,
        youtubeHandle: users.youtubeHandle,
        twitterHandle: users.twitterHandle,
        subdomain: users.subdomain,
        status: users.status,
        statusChangedAt: users.statusChangedAt,
        statusChangedBy: users.statusChangedBy,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult[0];

    // Get the invite that this user used to sign up (if any)
    const inviteResult = await db
      .select({
        id: invites.id,
        email: invites.email,
        createdAt: invites.createdAt,
        usedAt: invites.usedAt,
        createdBy: invites.createdBy,
      })
      .from(invites)
      .where(eq(invites.usedBy, userId))
      .limit(1);

    const invite = inviteResult[0] || null;

    // If there's an invite, get the creator's details
    let inviteCreator = null;
    if (invite?.createdBy) {
      const creatorResult = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, invite.createdBy))
        .limit(1);
      inviteCreator = creatorResult[0] || null;
    }

    // Get who changed the status (if applicable)
    let statusChangedByUser = null;
    if (user.statusChangedBy) {
      const statusChangerResult = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, user.statusChangedBy))
        .limit(1);
      statusChangedByUser = statusChangerResult[0] || null;
    }

    return NextResponse.json({
      user,
      invite: invite ? {
        ...invite,
        creator: inviteCreator,
      } : null,
      statusChangedByUser,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// PATCH /api/admin/users/[userId] - Update user status or subdomain
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();

    // Check if user exists
    const existingUser = await db
      .select({ id: users.id, email: users.email, subdomain: users.subdomain })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle subdomain update
    if ("subdomain" in body) {
      const { subdomain } = updateUserSubdomainSchema.parse(body);

      if (subdomain === null || subdomain === "") {
        // Clear subdomain
        const [updated] = await db
          .update(users)
          .set({
            subdomain: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            subdomain: users.subdomain,
          });

        return NextResponse.json({ user: updated });
      }

      // Validate subdomain
      const validation = validateSubdomain(subdomain);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Check if subdomain is already taken by another user
      const existingSubdomain = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.subdomain, validation.normalized!), ne(users.id, userId)))
        .limit(1);

      if (existingSubdomain.length > 0) {
        return NextResponse.json(
          { error: "This subdomain is already taken" },
          { status: 400 }
        );
      }

      const [updated] = await db
        .update(users)
        .set({
          subdomain: validation.normalized,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          subdomain: users.subdomain,
        });

      return NextResponse.json({ user: updated });
    }

    // Handle status update
    const { status } = updateUserStatusSchema.parse(body);

    // Prevent admin from changing their own status
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own status" },
        { status: 400 }
      );
    }

    // Prevent changing status of other admins
    if (isAdmin(existingUser[0].email)) {
      return NextResponse.json(
        { error: "Cannot change status of admin users" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(users)
      .set({
        status: status as UserStatus,
        statusChangedAt: new Date(),
        statusChangedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        statusChangedAt: users.statusChangedAt,
      });

    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[userId] - Permanently delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId } = await params;

    // Check if user exists
    const existingUser = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Prevent deleting other admins
    if (isAdmin(existingUser[0].email)) {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 400 }
      );
    }

    // Delete the user - cascades will handle sessions, accounts, media
    // Invites created by this user will be deleted (cascade)
    // Invites used by this user will have usedBy set to null (set null)
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true, deletedUser: existingUser[0] });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

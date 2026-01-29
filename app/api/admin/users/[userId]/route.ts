import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin, type UserStatus } from "@/lib/admin";
import { db } from "@/lib/db";
import { users, invites, waitlist } from "@/lib/db/schema";
import { eq, and, ne, or, desc } from "drizzle-orm";
import { z } from "zod";
import { validateSubdomain } from "@/lib/validation/subdomain";

const updateUserStatusSchema = z.object({
  status: z.enum(["active", "suspended", "banned"]),
});

const updateUserSubdomainSchema = z.object({
  subdomain: z.string().nullable(),
});

const updateUserVercelProjectIdSchema = z.object({
  vercelProjectId: z.string().nullable(),
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
        profileViewCount: users.profileViewCount,
        vercelProjectId: users.vercelProjectId,
        siteEnabled: users.siteEnabled,
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

    // Get ALL invites related to this user (sent to their email OR used by them)
    const allInvitesResult = await db
      .select({
        id: invites.id,
        email: invites.email,
        createdAt: invites.createdAt,
        expiresAt: invites.expiresAt,
        usedAt: invites.usedAt,
        usedBy: invites.usedBy,
        createdBy: invites.createdBy,
        revokedAt: invites.revokedAt,
      })
      .from(invites)
      .where(
        or(
          eq(invites.email, user.email),
          eq(invites.usedBy, userId)
        )
      )
      .orderBy(desc(invites.createdAt));

    // Get creator details for all invites
    const creatorIds = [...new Set(allInvitesResult.map(i => i.createdBy).filter(Boolean))];
    const creatorsResult = creatorIds.length > 0
      ? await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(or(...creatorIds.map(id => eq(users.id, id))))
      : [];

    const creatorsMap = new Map(creatorsResult.map(c => [c.id, c]));

    const allInvites = allInvitesResult.map(invite => ({
      ...invite,
      creator: invite.createdBy ? creatorsMap.get(invite.createdBy) || null : null,
      isUsedByThisUser: invite.usedBy === userId,
    }));

    // Get waitlist entry for this email (if any)
    const waitlistResult = await db
      .select({
        id: waitlist.id,
        email: waitlist.email,
        createdAt: waitlist.createdAt,
        invitedAt: waitlist.invitedAt,
        invitedBy: waitlist.invitedBy,
        instagramHandle: waitlist.instagramHandle,
        tiktokHandle: waitlist.tiktokHandle,
        youtubeHandle: waitlist.youtubeHandle,
        twitterHandle: waitlist.twitterHandle,
        facebookHandle: waitlist.facebookHandle,
      })
      .from(waitlist)
      .where(eq(waitlist.email, user.email))
      .limit(1);

    const waitlistEntry = waitlistResult[0] || null;

    // Get who invited from waitlist (if applicable)
    let waitlistInvitedByUser = null;
    if (waitlistEntry?.invitedBy) {
      const inviterResult = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, waitlistEntry.invitedBy))
        .limit(1);
      waitlistInvitedByUser = inviterResult[0] || null;
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

    // Find the invite that was used to sign up (for backwards compatibility)
    const usedInvite = allInvites.find(i => i.isUsedByThisUser) || null;

    return NextResponse.json({
      user,
      invite: usedInvite, // backwards compatibility
      allInvites,
      waitlistEntry: waitlistEntry ? {
        ...waitlistEntry,
        invitedByUser: waitlistInvitedByUser,
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

    // Handle vercelProjectId update
    if ("vercelProjectId" in body) {
      const { vercelProjectId } = updateUserVercelProjectIdSchema.parse(body);

      const [updated] = await db
        .update(users)
        .set({
          vercelProjectId: vercelProjectId === "" ? null : vercelProjectId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          vercelProjectId: users.vercelProjectId,
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

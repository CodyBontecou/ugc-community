import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin, type UserStatus } from "@/lib/admin";
import { db } from "@/lib/db";
import { users, invites, waitlist, contactSubmissions } from "@/lib/db/schema";
import { eq, and, ne, or, desc, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { validateSubdomain } from "@/lib/validation/subdomain";
import { createProject } from "@/lib/vercel/client";

const updateUserStatusSchema = z.object({
  status: z.enum(["active", "suspended", "banned"]),
});

const updateUserRoleSchema = z.object({
  role: z.enum(["creator", "brand"]),
});

const updateUserSubdomainSchema = z.object({
  subdomain: z.string().nullable(),
});

const updateUserVercelProjectIdSchema = z.object({
  vercelProjectId: z.string().nullable(),
});

const updateUserGitHubRepoSchema = z.object({
  githubRepoFullName: z.string().nullable(),
  githubRepoId: z.string().nullable(),
});

// Helper to clean social handles: trim, remove @ prefix, filter empty strings
function cleanHandles(handles: (string | null)[] | null | undefined): string[] | null {
  if (!handles || handles.length === 0) return null;
  const cleaned = handles
    .filter((h): h is string => h !== null && h !== undefined)
    .map(h => h.trim().replace(/^@/, ''))
    .filter(h => h.length > 0);
  return cleaned.length > 0 ? cleaned : null;
}

const socialHandleArraySchema = z
  .array(z.string().nullable())
  .max(5, "Maximum 5 handles per platform")
  .nullable()
  .optional();

const updateUserSocialHandlesSchema = z.object({
  instagramHandles: socialHandleArraySchema,
  tiktokHandles: socialHandleArraySchema,
  youtubeHandles: socialHandleArraySchema,
  twitterHandles: socialHandleArraySchema,
});

const updateUserBioSchema = z.object({
  bio: z.string().nullable(),
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
        instagramHandles: users.instagramHandles,
        tiktokHandles: users.tiktokHandles,
        youtubeHandles: users.youtubeHandles,
        twitterHandles: users.twitterHandles,
        subdomain: users.subdomain,
        status: users.status,
        role: users.role,
        statusChangedAt: users.statusChangedAt,
        statusChangedBy: users.statusChangedBy,
        profileViewCount: users.profileViewCount,
        portfolioViewCount: users.portfolioViewCount,
        vercelProjectId: users.vercelProjectId,
        siteEnabled: users.siteEnabled,
        githubRepoFullName: users.githubRepoFullName,
        githubRepoId: users.githubRepoId,
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

    // Get contact submission counts
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.creatorId, userId));

    const [last30DaysCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactSubmissions)
      .where(and(
        eq(contactSubmissions.creatorId, userId),
        gte(contactSubmissions.createdAt, thirtyDaysAgo)
      ));

    const [last7DaysCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactSubmissions)
      .where(and(
        eq(contactSubmissions.creatorId, userId),
        gte(contactSubmissions.createdAt, sevenDaysAgo)
      ));

    return NextResponse.json({
      user: {
        ...user,
        contactSubmissionCount: Number(totalCount?.count || 0),
        contactSubmissionCountLast30Days: Number(last30DaysCount?.count || 0),
        contactSubmissionCountLast7Days: Number(last7DaysCount?.count || 0),
      },
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

    // Handle GitHub repo update
    if ("githubRepoFullName" in body || "githubRepoId" in body) {
      const { githubRepoFullName, githubRepoId } = updateUserGitHubRepoSchema.parse(body);

      // If clearing the repo, just update the database
      if (!githubRepoFullName || githubRepoFullName === "") {
        const [updated] = await db
          .update(users)
          .set({
            githubRepoFullName: null,
            githubRepoId: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            githubRepoFullName: users.githubRepoFullName,
            githubRepoId: users.githubRepoId,
            vercelProjectId: users.vercelProjectId,
          });

        return NextResponse.json({ user: updated });
      }

      // Check if user already has a Vercel project
      const currentUser = await db
        .select({ vercelProjectId: users.vercelProjectId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      let vercelProjectId = currentUser[0]?.vercelProjectId;

      // If no Vercel project exists, create one with the GitHub repo linked
      if (!vercelProjectId) {
        try {
          // Use the repo name as the project name (e.g., "org/repo-name" -> "repo-name")
          const repoName = githubRepoFullName.split("/").pop() || githubRepoFullName;
          // Add a unique suffix to avoid naming conflicts
          const projectName = `${repoName}-${userId.slice(0, 8)}`;

          const project = await createProject({
            name: projectName,
            framework: "nextjs",
            gitRepository: {
              type: "github",
              repo: githubRepoFullName,
            },
          });

          vercelProjectId = project.id;
        } catch (error) {
          console.error("Failed to create Vercel project:", error);
          return NextResponse.json(
            { error: "Failed to create Vercel project. Please try again or set the project ID manually." },
            { status: 500 }
          );
        }
      }

      const [updated] = await db
        .update(users)
        .set({
          githubRepoFullName,
          githubRepoId: githubRepoId === "" ? null : githubRepoId,
          vercelProjectId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          githubRepoFullName: users.githubRepoFullName,
          githubRepoId: users.githubRepoId,
          vercelProjectId: users.vercelProjectId,
        });

      return NextResponse.json({ user: updated, vercelProjectCreated: !currentUser[0]?.vercelProjectId });
    }

    // Handle bio update
    if ("bio" in body) {
      const { bio } = updateUserBioSchema.parse(body);

      const [updated] = await db
        .update(users)
        .set({
          bio: bio === "" ? null : bio,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          bio: users.bio,
        });

      return NextResponse.json({ user: updated });
    }

    // Handle social handles update
    if ("instagramHandles" in body || "tiktokHandles" in body || "youtubeHandles" in body || "twitterHandles" in body) {
      const socialHandles = updateUserSocialHandlesSchema.parse(body);

      const updateData: Record<string, string[] | null | Date> = {
        updatedAt: new Date(),
      };

      // Only include fields that were explicitly provided, clean handles
      if ("instagramHandles" in body) {
        updateData.instagramHandles = cleanHandles(socialHandles.instagramHandles);
      }
      if ("tiktokHandles" in body) {
        updateData.tiktokHandles = cleanHandles(socialHandles.tiktokHandles);
      }
      if ("youtubeHandles" in body) {
        updateData.youtubeHandles = cleanHandles(socialHandles.youtubeHandles);
      }
      if ("twitterHandles" in body) {
        updateData.twitterHandles = cleanHandles(socialHandles.twitterHandles);
      }

      const [updated] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          instagramHandles: users.instagramHandles,
          tiktokHandles: users.tiktokHandles,
          youtubeHandles: users.youtubeHandles,
          twitterHandles: users.twitterHandles,
        });

      return NextResponse.json({ user: updated });
    }

    // Handle role update
    if ("role" in body) {
      const { role } = updateUserRoleSchema.parse(body);

      const [updated] = await db
        .update(users)
        .set({
          role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
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

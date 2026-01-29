import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users, waitlist } from "@/lib/db/schema";
import { listAllInvites, getInviteUrl } from "@/lib/invites";
import { desc, eq } from "drizzle-orm";

export type RecordType = "user" | "invite" | "waitlist";

export interface SocialHandles {
  // User handles are arrays (up to 5 per platform)
  instagram?: string[] | string | null;
  tiktok?: string[] | string | null;
  youtube?: string[] | string | null;
  // Waitlist uses single strings
  facebook?: string | null;
  twitter?: string[] | string | null;
}

export interface UnifiedRecord {
  id: string;
  type: RecordType;
  email: string;
  name: string | null;
  status: string;
  createdAt: string;
  // User-specific
  image?: string | null;
  subdomain?: string | null;
  displayName?: string | null;
  // Waitlist-specific
  socials?: SocialHandles | null;
  // Invite-specific
  inviteUrl?: string;
  expiresAt?: string;
  usedBy?: { name: string } | null;
  creator?: { name: string } | null;
  token?: string;
}

// GET /api/admin/people - List all users, invites, and waitlist entries
export async function GET() {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Fetch all data in parallel
    const [allUsers, allInvites, waitlistEntries] = await Promise.all([
      // Users
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          displayName: users.displayName,
          subdomain: users.subdomain,
          status: users.status,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt)),

      // Invites
      listAllInvites(),

      // Waitlist
      db
        .select({
          id: waitlist.id,
          email: waitlist.email,
          instagramHandle: waitlist.instagramHandle,
          tiktokHandle: waitlist.tiktokHandle,
          youtubeHandle: waitlist.youtubeHandle,
          facebookHandle: waitlist.facebookHandle,
          twitterHandle: waitlist.twitterHandle,
          createdAt: waitlist.createdAt,
          invitedAt: waitlist.invitedAt,
          invitedBy: waitlist.invitedBy,
        })
        .from(waitlist)
        .orderBy(desc(waitlist.createdAt)),
    ]);

    // Fetch inviter details for waitlist entries
    const waitlistWithInviters = await Promise.all(
      waitlistEntries.map(async (entry) => {
        let inviter = null;
        if (entry.invitedBy) {
          const [user] = await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(eq(users.id, entry.invitedBy))
            .limit(1);
          inviter = user || null;
        }
        return { ...entry, inviter };
      })
    );

    // Create a set of user emails to filter out related waitlist/invite entries
    // When someone becomes a user, their waitlist entry and used invite are consolidated
    const userEmails = new Set(allUsers.map((u) => u.email.toLowerCase()));

    // Normalize all records into unified format
    const records: UnifiedRecord[] = [];

    // Add users
    for (const user of allUsers) {
      records.push({
        id: user.id,
        type: "user",
        email: user.email,
        name: user.name,
        status: user.status || "active",
        createdAt: user.createdAt.toISOString(),
        image: user.image,
        subdomain: user.subdomain,
        displayName: user.displayName,
      });
    }

    // Add invites (skip used invites since they're now represented by the user)
    for (const invite of allInvites) {
      const isExpired = new Date(invite.expiresAt) < new Date();
      const isUsed = !!invite.usedAt;
      const isRevoked = !!invite.revokedAt;

      // Skip used invites - they've converted to users and are visible in user detail pages
      if (isUsed) continue;

      let status = "active";
      if (isRevoked) status = "revoked";
      else if (isExpired) status = "expired";

      records.push({
        id: invite.id,
        type: "invite",
        email: invite.email || "Open invite",
        name: null,
        status,
        createdAt: invite.createdAt.toISOString(),
        inviteUrl: getInviteUrl(invite.token),
        expiresAt: invite.expiresAt.toISOString(),
        usedBy: null,
        creator: invite.creator ? { name: invite.creator.name } : null,
        token: invite.token,
      });
    }

    // Add waitlist entries (skip entries where the person is now a user)
    for (const entry of waitlistWithInviters) {
      // Skip if this email has become a user - their journey is consolidated in the user view
      if (userEmails.has(entry.email.toLowerCase())) continue;

      records.push({
        id: entry.id,
        type: "waitlist",
        email: entry.email,
        name: null,
        status: entry.invitedAt ? "invited" : "pending",
        createdAt: entry.createdAt.toISOString(),
        socials: {
          instagram: entry.instagramHandle,
          tiktok: entry.tiktokHandle,
          youtube: entry.youtubeHandle,
          facebook: entry.facebookHandle,
          twitter: entry.twitterHandle,
        },
      });
    }

    // Sort all records by createdAt (newest first)
    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ records });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing people:", error);
    return NextResponse.json({ error: "Failed to list people" }, { status: 500 });
  }
}

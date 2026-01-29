import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { waitlist, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const entries = await db
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
      .orderBy(desc(waitlist.createdAt));

    // Fetch inviter details for entries that have been invited
    const entriesWithInviters = await Promise.all(
      entries.map(async (entry) => {
        let inviter = null;
        if (entry.invitedBy) {
          const [user] = await db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, entry.invitedBy))
            .limit(1);
          inviter = user || null;
        }
        return {
          ...entry,
          inviter,
        };
      })
    );

    return NextResponse.json({ waitlist: entriesWithInviters });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing waitlist:", error);
    return NextResponse.json({ error: "Failed to list waitlist" }, { status: 500 });
  }
}

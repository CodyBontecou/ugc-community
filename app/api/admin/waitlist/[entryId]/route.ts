import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { waitlist, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { entryId } = await params;
    const body = await request.json();

    // Find the waitlist entry
    const [entry] = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.id, entryId))
      .limit(1);

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Mark as invited
    if (body.markInvited) {
      // Get the current user's ID
      const [currentUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1);

      const [updated] = await db
        .update(waitlist)
        .set({
          invitedAt: new Date(),
          invitedBy: currentUser?.id || null,
        })
        .where(eq(waitlist.id, entryId))
        .returning();

      // Fetch inviter details
      let inviter = null;
      if (updated.invitedBy) {
        const [user] = await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, updated.invitedBy))
          .limit(1);
        inviter = user || null;
      }

      return NextResponse.json({
        entry: {
          ...updated,
          inviter,
        },
      });
    }

    return NextResponse.json({ error: "No valid operation specified" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating waitlist entry:", error);
    return NextResponse.json({ error: "Failed to update waitlist entry" }, { status: 500 });
  }
}

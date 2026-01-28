import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { invites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// DELETE /api/admin/invites/[inviteId] - Revoke an invite
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { inviteId } = await params;

    // Check if invite exists
    const existingInvite = await db
      .select({ id: invites.id, usedAt: invites.usedAt, revokedAt: invites.revokedAt })
      .from(invites)
      .where(eq(invites.id, inviteId))
      .limit(1);

    if (existingInvite.length === 0) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (existingInvite[0].usedAt) {
      return NextResponse.json(
        { error: "Cannot revoke an invite that has already been used" },
        { status: 400 }
      );
    }

    if (existingInvite[0].revokedAt) {
      return NextResponse.json(
        { error: "Invite has already been revoked" },
        { status: 400 }
      );
    }

    const [revoked] = await db
      .update(invites)
      .set({
        revokedAt: new Date(),
        revokedBy: session.user.id,
      })
      .where(eq(invites.id, inviteId))
      .returning({
        id: invites.id,
        token: invites.token,
        revokedAt: invites.revokedAt,
      });

    return NextResponse.json({ invite: revoked });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error revoking invite:", error);
    return NextResponse.json({ error: "Failed to revoke invite" }, { status: 500 });
  }
}

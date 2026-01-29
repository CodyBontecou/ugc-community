import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { getInviteById, getInviteUrl } from "@/lib/invites";
import { sendInvitationEmail } from "@/lib/email";

// POST /api/admin/invites/[inviteId]/resend - Resend invitation email
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
    const invite = await getInviteById(inviteId);

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (!invite.email) {
      return NextResponse.json(
        { error: "Cannot resend email for open invites (no email assigned)" },
        { status: 400 }
      );
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { error: "Cannot resend email for used invites" },
        { status: 400 }
      );
    }

    if (invite.revokedAt) {
      return NextResponse.json(
        { error: "Cannot resend email for revoked invites" },
        { status: 400 }
      );
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Cannot resend email for expired invites" },
        { status: 400 }
      );
    }

    const inviteUrl = getInviteUrl(invite.token);
    await sendInvitationEmail(invite.email, inviteUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error resending invite email:", error);
    return NextResponse.json({ error: "Failed to resend invite email" }, { status: 500 });
  }
}

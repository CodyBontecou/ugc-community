import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { createInvite, listAllInvites, getInviteUrl } from "@/lib/invites";
import { sendInvitationEmail } from "@/lib/email";
import { z } from "zod";

const createInviteSchema = z.object({
  email: z.string().email().optional(),
  expirationDays: z.number().min(1).max(90).optional(),
  sendEmail: z.boolean().optional(),
});

// POST /api/admin/invites - Create a new invite
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { email, expirationDays, sendEmail } = createInviteSchema.parse(body);

    const invite = await createInvite({
      createdBy: session.user.id,
      email,
      expirationDays,
    });

    const inviteUrl = getInviteUrl(invite.token);

    // Send invitation email if requested and email is provided
    let emailSent = false;
    if (sendEmail && email) {
      try {
        await sendInvitationEmail(email, inviteUrl);
        emailSent = true;
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail the invite creation if email fails
      }
    }

    return NextResponse.json({
      invite: {
        id: invite.id,
        token: invite.token,
        email: invite.email,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        url: inviteUrl,
        emailSent,
      },
    });
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
    console.error("Error creating invite:", error);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}

// GET /api/admin/invites - List all invites
export async function GET() {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const invites = await listAllInvites();

    return NextResponse.json({
      invites: invites.map((invite) => ({
        id: invite.id,
        token: invite.token,
        email: invite.email,
        expiresAt: invite.expiresAt,
        usedAt: invite.usedAt,
        revokedAt: invite.revokedAt,
        createdAt: invite.createdAt,
        url: getInviteUrl(invite.token),
        creator: invite.creator,
        usedBy: invite.usedByUser,
        isExpired: new Date(invite.expiresAt) < new Date(),
        isUsed: !!invite.usedAt,
        isRevoked: !!invite.revokedAt,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing invites:", error);
    return NextResponse.json({ error: "Failed to list invites" }, { status: 500 });
  }
}

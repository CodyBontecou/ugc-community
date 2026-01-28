import { NextRequest, NextResponse } from "next/server";
import { getInviteByToken } from "@/lib/invites";

// GET /api/invites/validate?token=xxx - Validate an invite token
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { valid: false, error: "Token required" },
      { status: 400 }
    );
  }

  const invite = await getInviteByToken(token);

  if (!invite) {
    return NextResponse.json({
      valid: false,
      error: "Invalid invite link",
    });
  }

  if (invite.usedAt) {
    return NextResponse.json({
      valid: false,
      error: "This invite has already been used",
    });
  }

  if (new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({
      valid: false,
      error: "This invite has expired",
    });
  }

  return NextResponse.json({
    valid: true,
    email: invite.email, // May be null if not pre-assigned
    expiresAt: invite.expiresAt,
  });
}

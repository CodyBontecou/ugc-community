import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { validateInviteForEmail, markInviteAsUsed } from "@/lib/invites";
import { z } from "zod";

const useInviteSchema = z.object({
  token: z.string(),
});

// POST /api/invites/use - Mark an invite as used after registration
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const { token } = useInviteSchema.parse(body);

    const result = await validateInviteForEmail(token, session.user.email);

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await markInviteAsUsed(result.invite!.id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error using invite:", error);
    return NextResponse.json({ error: "Failed to use invite" }, { status: 500 });
  }
}

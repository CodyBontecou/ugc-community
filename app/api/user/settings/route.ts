import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// GET /api/user/settings - Get user settings
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .select({
        name: users.name,
        displayName: users.displayName,
        bio: users.bio,
        websiteUrl: users.websiteUrl,
        tiktokHandles: users.tiktokHandles,
        instagramHandles: users.instagramHandles,
        hideBadges: users.hideBadges,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ settings: user[0] });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

const updateSettingsSchema = z.object({
  hideBadges: z.boolean().optional(),
});

// PATCH /api/user/settings - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateSettingsSchema.parse(body);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validated.hideBadges !== undefined) {
      updateData.hideBadges = validated.hideBadges;
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning({
        hideBadges: users.hideBadges,
      });

    return NextResponse.json({ settings: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }
    console.error("Error updating user settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

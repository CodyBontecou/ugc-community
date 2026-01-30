import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getUserEditAllowance, consumeEdit } from "@/lib/edits/allowance";

const updateProfileSchema = z.object({
  displayName: z.string().max(50, "Display name must be 50 characters or less").optional().nullable(),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional().nullable(),
  tagline: z.string().max(160, "Tagline must be 160 characters or less").optional().nullable(),
  instagramHandles: z.array(z.string()).max(5).optional().nullable(),
  tiktokHandles: z.array(z.string()).max(5).optional().nullable(),
  youtubeHandles: z.array(z.string()).max(5).optional().nullable(),
  twitterHandles: z.array(z.string()).max(5).optional().nullable(),
  websiteUrl: z.string().url().max(200).optional().nullable().or(z.literal("")),
});

// GET /api/user/profile - Get profile and edit allowance
export async function GET() {
  try {
    const session = await requireAuth();

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        id: true,
        name: true,
        displayName: true,
        bio: true,
        tagline: true,
        image: true,
        websiteUrl: true,
        instagramHandles: true,
        tiktokHandles: true,
        youtubeHandles: true,
        twitterHandles: true,
        subdomain: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const editAllowance = await getUserEditAllowance(session.user.id);

    return NextResponse.json({
      profile: user,
      editAllowance,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH /api/user/profile - Update profile (consumes 1 edit)
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Check edit allowance
    const allowance = await getUserEditAllowance(session.user.id);
    if (!allowance.canEdit) {
      return NextResponse.json(
        {
          error: "No profile edits remaining this month",
          editAllowance: allowance,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    // Check if any field is actually being changed
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        displayName: true,
        bio: true,
        tagline: true,
        instagramHandles: true,
        tiktokHandles: true,
        youtubeHandles: true,
        twitterHandles: true,
        websiteUrl: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update object with only changed fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    let hasChanges = false;

    if (validated.displayName !== undefined && validated.displayName !== currentUser.displayName) {
      updateData.displayName = validated.displayName;
      hasChanges = true;
    }

    if (validated.bio !== undefined && validated.bio !== currentUser.bio) {
      updateData.bio = validated.bio;
      hasChanges = true;
    }

    if (validated.tagline !== undefined && validated.tagline !== currentUser.tagline) {
      updateData.tagline = validated.tagline;
      hasChanges = true;
    }

    if (validated.websiteUrl !== undefined) {
      const newUrl = validated.websiteUrl === "" ? null : validated.websiteUrl;
      if (newUrl !== currentUser.websiteUrl) {
        updateData.websiteUrl = newUrl;
        hasChanges = true;
      }
    }

    if (validated.instagramHandles !== undefined) {
      const newHandles = validated.instagramHandles ?? [];
      const currentHandles = currentUser.instagramHandles ?? [];
      if (JSON.stringify(newHandles) !== JSON.stringify(currentHandles)) {
        updateData.instagramHandles = newHandles;
        hasChanges = true;
      }
    }

    if (validated.tiktokHandles !== undefined) {
      const newHandles = validated.tiktokHandles ?? [];
      const currentHandles = currentUser.tiktokHandles ?? [];
      if (JSON.stringify(newHandles) !== JSON.stringify(currentHandles)) {
        updateData.tiktokHandles = newHandles;
        hasChanges = true;
      }
    }

    if (validated.youtubeHandles !== undefined) {
      const newHandles = validated.youtubeHandles ?? [];
      const currentHandles = currentUser.youtubeHandles ?? [];
      if (JSON.stringify(newHandles) !== JSON.stringify(currentHandles)) {
        updateData.youtubeHandles = newHandles;
        hasChanges = true;
      }
    }

    if (validated.twitterHandles !== undefined) {
      const newHandles = validated.twitterHandles ?? [];
      const currentHandles = currentUser.twitterHandles ?? [];
      if (JSON.stringify(newHandles) !== JSON.stringify(currentHandles)) {
        updateData.twitterHandles = newHandles;
        hasChanges = true;
      }
    }

    // No changes to apply
    if (!hasChanges) {
      const updatedAllowance = await getUserEditAllowance(session.user.id);
      return NextResponse.json({
        message: "No changes detected",
        editAllowance: updatedAllowance,
      });
    }

    // Consume an edit
    const consumed = await consumeEdit(session.user.id);
    if (!consumed) {
      return NextResponse.json(
        { error: "Failed to consume edit allowance" },
        { status: 500 }
      );
    }

    // Apply the update
    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning({
        displayName: users.displayName,
        bio: users.bio,
        tagline: users.tagline,
        websiteUrl: users.websiteUrl,
        instagramHandles: users.instagramHandles,
        tiktokHandles: users.tiktokHandles,
        youtubeHandles: users.youtubeHandles,
        twitterHandles: users.twitterHandles,
      });

    const updatedAllowance = await getUserEditAllowance(session.user.id);

    return NextResponse.json({
      profile: updated,
      editAllowance: updatedAllowance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

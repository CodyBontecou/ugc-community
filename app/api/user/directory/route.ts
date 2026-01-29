import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { NICHES, RATE_RANGES, type Niche, type RateRange } from "@/lib/directory/constants";

const updateDirectorySchema = z.object({
  directoryListed: z.boolean().optional(),
  availableForHire: z.boolean().optional(),
  niches: z
    .array(z.enum(NICHES as unknown as [string, ...string[]]))
    .max(5, "Maximum 5 niches allowed")
    .optional(),
  locationCity: z.string().max(100).optional().nullable(),
  locationCountry: z.string().max(100).optional().nullable(),
  rateRange: z
    .enum(RATE_RANGES as unknown as [string, ...string[]])
    .optional()
    .nullable(),
  tagline: z.string().max(160, "Tagline must be 160 characters or less").optional().nullable(),
});

// GET /api/user/directory - Get current user's directory settings
export async function GET() {
  try {
    const session = await requireAuth();

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        directoryListed: true,
        availableForHire: true,
        niches: true,
        locationCity: true,
        locationCountry: true,
        rateRange: true,
        tagline: true,
        directoryJoinedAt: true,
        subdomain: true,
        displayName: true,
        name: true,
        image: true,
        bio: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching directory settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch directory settings" },
      { status: 500 }
    );
  }
}

// PATCH /api/user/directory - Update directory settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const validated = updateDirectorySchema.parse(body);

    // Check if user has a subdomain (required for directory listing)
    if (validated.directoryListed === true) {
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { subdomain: true, directoryListed: true },
      });

      if (!currentUser?.subdomain) {
        return NextResponse.json(
          { error: "You must set up a subdomain before joining the directory" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validated.directoryListed !== undefined) {
      updateData.directoryListed = validated.directoryListed;

      // Set directoryJoinedAt when first listing
      if (validated.directoryListed === true) {
        const currentUser = await db.query.users.findFirst({
          where: eq(users.id, session.user.id),
          columns: { directoryJoinedAt: true },
        });

        if (!currentUser?.directoryJoinedAt) {
          updateData.directoryJoinedAt = new Date();
        }
      }
    }

    if (validated.availableForHire !== undefined) {
      updateData.availableForHire = validated.availableForHire;
    }

    if (validated.niches !== undefined) {
      updateData.niches = validated.niches;
    }

    if (validated.locationCity !== undefined) {
      updateData.locationCity = validated.locationCity;
    }

    if (validated.locationCountry !== undefined) {
      updateData.locationCountry = validated.locationCountry;
    }

    if (validated.rateRange !== undefined) {
      updateData.rateRange = validated.rateRange;
    }

    if (validated.tagline !== undefined) {
      updateData.tagline = validated.tagline;
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning({
        directoryListed: users.directoryListed,
        availableForHire: users.availableForHire,
        niches: users.niches,
        locationCity: users.locationCity,
        locationCountry: users.locationCountry,
        rateRange: users.rateRange,
        tagline: users.tagline,
        directoryJoinedAt: users.directoryJoinedAt,
      });

    return NextResponse.json(updated);
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
    console.error("Error updating directory settings:", error);
    return NextResponse.json(
      { error: "Failed to update directory settings" },
      { status: 500 }
    );
  }
}

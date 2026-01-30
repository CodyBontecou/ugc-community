import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedCreators, users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { isBrand } from "@/lib/roles";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const saveCreatorSchema = z.object({
  creatorId: z.string().min(1, "Creator ID is required"),
});

// GET /api/brands/saved-creators - List saved creators
// Query params:
//   - ids_only=true: Return only creator IDs (for directory page)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Verify user is a brand
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { role: true },
    });

    if (!user || !isBrand(user.role)) {
      return NextResponse.json(
        { error: "Only brands can access saved creators" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const idsOnly = searchParams.get("ids_only") === "true";

    if (idsOnly) {
      // Return just creator IDs for efficient checking on directory page
      const saved = await db
        .select({ creatorId: savedCreators.creatorId })
        .from(savedCreators)
        .where(eq(savedCreators.brandId, session.user.id));

      return NextResponse.json({
        creatorIds: saved.map((s) => s.creatorId),
      });
    }

    // Return full saved creators with creator details
    const saved = await db
      .select({
        id: savedCreators.id,
        creatorId: savedCreators.creatorId,
        savedAt: savedCreators.createdAt,
        creator: {
          id: users.id,
          name: users.name,
          displayName: users.displayName,
          image: users.image,
          subdomain: users.subdomain,
          tagline: users.tagline,
          niches: users.niches,
          locationCity: users.locationCity,
          locationCountry: users.locationCountry,
          availableForHire: users.availableForHire,
          isVerified: users.isVerified,
          isFeatured: users.isFeatured,
        },
      })
      .from(savedCreators)
      .innerJoin(users, eq(savedCreators.creatorId, users.id))
      .where(eq(savedCreators.brandId, session.user.id))
      .orderBy(savedCreators.createdAt);

    return NextResponse.json({ savedCreators: saved });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching saved creators:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved creators" },
      { status: 500 }
    );
  }
}

// POST /api/brands/saved-creators - Save a creator
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Verify user is a brand
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { role: true },
    });

    if (!user || !isBrand(user.role)) {
      return NextResponse.json(
        { error: "Only brands can save creators" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = saveCreatorSchema.parse(body);

    // Verify creator exists
    const creator = await db.query.users.findFirst({
      where: eq(users.id, validated.creatorId),
      columns: { id: true },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    // Check if already saved
    const existing = await db.query.savedCreators.findFirst({
      where: and(
        eq(savedCreators.brandId, session.user.id),
        eq(savedCreators.creatorId, validated.creatorId)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Creator already saved" },
        { status: 409 }
      );
    }

    // Save the creator
    const [saved] = await db
      .insert(savedCreators)
      .values({
        brandId: session.user.id,
        creatorId: validated.creatorId,
      })
      .returning();

    return NextResponse.json({ saved }, { status: 201 });
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
    console.error("Error saving creator:", error);
    return NextResponse.json(
      { error: "Failed to save creator" },
      { status: 500 }
    );
  }
}

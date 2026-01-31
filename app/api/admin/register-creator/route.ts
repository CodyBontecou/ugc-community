import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { z } from "zod";

// Token-based auth for GitHub Actions
// Set CREATOR_REGISTRATION_SECRET in your .env
function isValidToken(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  const secret = process.env.CREATOR_REGISTRATION_SECRET;

  if (!secret) {
    console.error("CREATOR_REGISTRATION_SECRET not configured");
    return false;
  }

  return token === secret;
}

// Helper to normalize handles input - accepts string or array, returns array
function normalizeHandles(input: string | string[] | undefined): string[] | null {
  if (!input) return null;
  const arr = Array.isArray(input) ? input : [input];
  const cleaned = arr
    .map(h => h.trim().replace(/^@/, ''))
    .filter(h => h.length > 0)
    .slice(0, 5); // Max 5 handles
  return cleaned.length > 0 ? cleaned : null;
}

const handleSchema = z.union([
  z.string().max(255),
  z.array(z.string().max(255)).max(5),
]).optional();

const registerCreatorSchema = z.object({
  subdomain: z
    .string()
    .min(1)
    .max(63)
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      "Subdomain must be lowercase alphanumeric with optional hyphens"
    )
    .transform((s) => s.toLowerCase()),
  name: z.string().min(1).max(255),
  email: z.string().email(),
  displayName: z.string().max(255).optional(),
  bio: z.string().max(1000).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  // Accept either single string or array for backwards compatibility
  instagramHandle: handleSchema,
  instagramHandles: handleSchema,
  tiktokHandle: handleSchema,
  tiktokHandles: handleSchema,
  youtubeHandle: handleSchema,
  youtubeHandles: handleSchema,
  twitterHandle: handleSchema,
  twitterHandles: handleSchema,
});

export type RegisterCreatorInput = z.infer<typeof registerCreatorSchema>;

// POST /api/admin/register-creator - Register a new creator from GitHub Action
export async function POST(request: NextRequest) {
  try {
    if (!isValidToken(request)) {
      return NextResponse.json(
        { error: "Invalid or missing authorization token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = registerCreatorSchema.parse(body);

    // Check if subdomain already exists
    const existingBySubdomain = await db
      .select()
      .from(users)
      .where(eq(users.subdomain, data.subdomain))
      .limit(1);

    if (existingBySubdomain.length > 0) {
      // Update existing creator
      const [updated] = await db
        .update(users)
        .set({
          name: data.name,
          displayName: data.displayName || data.name,
          bio: data.bio,
          websiteUrl: data.websiteUrl || null,
          instagramHandles: normalizeHandles(data.instagramHandles || data.instagramHandle),
          tiktokHandles: normalizeHandles(data.tiktokHandles || data.tiktokHandle),
          youtubeHandles: normalizeHandles(data.youtubeHandles || data.youtubeHandle),
          twitterHandles: normalizeHandles(data.twitterHandles || data.twitterHandle),
          updatedAt: new Date(),
        })
        .where(eq(users.subdomain, data.subdomain))
        .returning();

      return NextResponse.json({
        success: true,
        action: "updated",
        creator: {
          id: updated.id,
          subdomain: updated.subdomain,
          name: updated.name,
          email: updated.email,
        },
      });
    }

    // Check if email already exists
    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingByEmail.length > 0) {
      // Update existing user with subdomain
      const [updated] = await db
        .update(users)
        .set({
          subdomain: data.subdomain,
          username: data.subdomain,
          name: data.name,
          displayName: data.displayName || data.name,
          bio: data.bio,
          websiteUrl: data.websiteUrl || null,
          instagramHandles: normalizeHandles(data.instagramHandles || data.instagramHandle),
          tiktokHandles: normalizeHandles(data.tiktokHandles || data.tiktokHandle),
          youtubeHandles: normalizeHandles(data.youtubeHandles || data.youtubeHandle),
          twitterHandles: normalizeHandles(data.twitterHandles || data.twitterHandle),
          updatedAt: new Date(),
        })
        .where(eq(users.email, data.email))
        .returning();

      return NextResponse.json({
        success: true,
        action: "updated",
        creator: {
          id: updated.id,
          subdomain: updated.subdomain,
          name: updated.name,
          email: updated.email,
        },
      });
    }

    // Create new creator
    const [created] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: data.email,
        name: data.name,
        username: data.subdomain,
        subdomain: data.subdomain,
        displayName: data.displayName || data.name,
        bio: data.bio,
        websiteUrl: data.websiteUrl || null,
        instagramHandles: normalizeHandles(data.instagramHandles || data.instagramHandle),
        tiktokHandles: normalizeHandles(data.tiktokHandles || data.tiktokHandle),
        youtubeHandles: normalizeHandles(data.youtubeHandles || data.youtubeHandle),
        twitterHandles: normalizeHandles(data.twitterHandles || data.twitterHandle),
        emailVerified: true, // External creators are pre-verified
      })
      .returning();

    return NextResponse.json({
      success: true,
      action: "created",
      creator: {
        id: created.id,
        subdomain: created.subdomain,
        name: created.name,
        email: created.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error registering creator:", error);
    return NextResponse.json(
      { error: "Failed to register creator" },
      { status: 500 }
    );
  }
}

// GET /api/admin/register-creator - List all registered creators (for landing page)
export async function GET() {
  try {
    // Public endpoint so the landing page can fetch creators
    const creators = await db
      .select({
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        subdomain: users.subdomain,
        bio: users.bio,
        image: users.image,
        instagramHandles: users.instagramHandles,
        tiktokHandles: users.tiktokHandles,
        youtubeHandles: users.youtubeHandles,
        twitterHandles: users.twitterHandles,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(isNotNull(users.subdomain))
      .orderBy(users.createdAt);

    return NextResponse.json({
      creators,
      count: creators.length,
    });
  } catch (error) {
    console.error("Error listing creators:", error);
    return NextResponse.json(
      { error: "Failed to list creators" },
      { status: 500 }
    );
  }
}

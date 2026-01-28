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
  instagramHandle: z.string().max(255).optional(),
  tiktokHandle: z.string().max(255).optional(),
  youtubeHandle: z.string().max(255).optional(),
  twitterHandle: z.string().max(255).optional(),
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
          instagramHandle: data.instagramHandle,
          tiktokHandle: data.tiktokHandle,
          youtubeHandle: data.youtubeHandle,
          twitterHandle: data.twitterHandle,
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
          instagramHandle: data.instagramHandle,
          tiktokHandle: data.tiktokHandle,
          youtubeHandle: data.youtubeHandle,
          twitterHandle: data.twitterHandle,
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
        instagramHandle: data.instagramHandle,
        tiktokHandle: data.tiktokHandle,
        youtubeHandle: data.youtubeHandle,
        twitterHandle: data.twitterHandle,
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
        { error: error.errors[0]?.message || "Invalid input", details: error.errors },
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
        instagramHandle: users.instagramHandle,
        tiktokHandle: users.tiktokHandle,
        youtubeHandle: users.youtubeHandle,
        twitterHandle: users.twitterHandle,
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

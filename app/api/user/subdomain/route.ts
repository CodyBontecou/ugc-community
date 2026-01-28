import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import {
  validateSubdomain,
  generateSubdomainSuggestions,
} from "@/lib/validation/subdomain";
import { z } from "zod";

const claimSubdomainSchema = z.object({
  subdomain: z.string(),
});

// POST /api/user/subdomain - Claim or update subdomain
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const { subdomain } = claimSubdomainSchema.parse(body);

    // Validate subdomain format, reserved words, profanity
    const validation = validateSubdomain(subdomain);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const normalizedSubdomain = validation.normalized!;

    // Check if already taken by another user
    const existing = await db.query.users.findFirst({
      where: eq(users.subdomain, normalizedSubdomain),
    });

    if (existing && existing.id !== session.user.id) {
      // Generate suggestions for the user
      const suggestions = generateSubdomainSuggestions(normalizedSubdomain);

      return NextResponse.json(
        {
          error: "This subdomain is already taken",
          suggestions,
        },
        { status: 400 }
      );
    }

    // Update user's subdomain
    const [updated] = await db
      .update(users)
      .set({
        subdomain: normalizedSubdomain,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    return NextResponse.json({
      subdomain: updated.subdomain,
      url: `https://${updated.subdomain}.${process.env.NEXT_PUBLIC_DOMAIN || "mysite.com"}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid subdomain" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating subdomain:", error);
    return NextResponse.json(
      { error: "Failed to update subdomain" },
      { status: 500 }
    );
  }
}

// GET /api/user/subdomain?check=xxx - Check if subdomain is available (real-time)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subdomainToCheck = searchParams.get("check");

  // If no check param, return current user's subdomain
  if (!subdomainToCheck) {
    try {
      const session = await requireAuth();
      const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { subdomain: true },
      });

      return NextResponse.json({
        subdomain: user?.subdomain || null,
        url: user?.subdomain
          ? `https://${user.subdomain}.${process.env.NEXT_PUBLIC_DOMAIN || "mysite.com"}`
          : null,
      });
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Validate subdomain format, reserved words, profanity
  const validation = validateSubdomain(subdomainToCheck);
  if (!validation.valid) {
    return NextResponse.json({
      available: false,
      reason: validation.error,
    });
  }

  const normalizedSubdomain = validation.normalized!;

  // Check database availability
  const existing = await db.query.users.findFirst({
    where: eq(users.subdomain, normalizedSubdomain),
    columns: { id: true },
  });

  if (existing) {
    // Generate suggestions
    const suggestions = generateSubdomainSuggestions(normalizedSubdomain);

    return NextResponse.json({
      available: false,
      reason: "Already taken",
      suggestions,
    });
  }

  return NextResponse.json({
    available: true,
    normalized: normalizedSubdomain,
    url: `https://${normalizedSubdomain}.${process.env.NEXT_PUBLIC_DOMAIN || "mysite.com"}`,
  });
}

// DELETE /api/user/subdomain - Release subdomain
export async function DELETE() {
  try {
    const session = await requireAuth();

    await db
      .update(users)
      .set({
        subdomain: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error releasing subdomain:", error);
    return NextResponse.json(
      { error: "Failed to release subdomain" },
      { status: 500 }
    );
  }
}

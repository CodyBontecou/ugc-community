import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { z } from "zod";

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-z0-9_-]+$/,
      "Username can only contain lowercase letters, numbers, underscores, and hyphens"
    ),
});

// Reserved usernames that can't be claimed
const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "www",
  "app",
  "dashboard",
  "auth",
  "login",
  "signup",
  "sign-in",
  "sign-up",
  "register",
  "help",
  "support",
  "blog",
  "docs",
  "mail",
  "email",
  "status",
  "settings",
  "profile",
  "portfolios",
  "media",
  "discover",
]);

// POST /api/user/username - Claim or update username
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const { username } = usernameSchema.parse(body);

    // Check if reserved
    if (RESERVED_USERNAMES.has(username.toLowerCase())) {
      return NextResponse.json(
        { error: "This username is reserved" },
        { status: 400 }
      );
    }

    // Check if already taken
    const existing = await db.query.users.findFirst({
      where: eq(users.username, username.toLowerCase()),
    });

    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { error: "This username is already taken" },
        { status: 400 }
      );
    }

    // Update user's username
    const [updated] = await db
      .update(users)
      .set({
        username: username.toLowerCase(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    return NextResponse.json({ username: updated.username });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid username" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating username:", error);
    return NextResponse.json(
      { error: "Failed to update username" },
      { status: 500 }
    );
  }
}

// GET /api/user/username/check?username=xxx - Check if username is available
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  // Check basic validation
  if (!/^[a-z0-9_-]+$/i.test(username)) {
    return NextResponse.json({ available: false, reason: "Invalid format" });
  }

  if (username.length < 3 || username.length > 30) {
    return NextResponse.json({ available: false, reason: "Invalid length" });
  }

  // Check if reserved
  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    return NextResponse.json({ available: false, reason: "Reserved" });
  }

  // Check database
  const existing = await db.query.users.findFirst({
    where: eq(users.username, username.toLowerCase()),
  });

  return NextResponse.json({ available: !existing });
}

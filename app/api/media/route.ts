import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, desc, and, sql } from "drizzle-orm";

// GET /api/media - List user's media with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // "image" | "video" | "all"
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Validate pagination params
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));
    const offset = (validPage - 1) * validLimit;

    // Build where clause
    const conditions = [eq(media.userId, session.user.id)];
    if (type !== "all") {
      conditions.push(eq(media.type, type));
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(media)
      .where(and(...conditions));

    // Get paginated results
    const items = await db
      .select()
      .from(media)
      .where(and(...conditions))
      .orderBy(desc(media.createdAt))
      .limit(validLimit)
      .offset(offset);

    return NextResponse.json({
      items,
      pagination: {
        page: validPage,
        limit: validLimit,
        total: count,
        totalPages: Math.ceil(count / validLimit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing media:", error);
    return NextResponse.json(
      { error: "Failed to list media" },
      { status: 500 }
    );
  }
}

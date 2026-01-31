import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { or, ilike, eq, and, ne } from "drizzle-orm";

// GET /api/users/search - Search for users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [] });
    }

    const searchTerm = `%${query.trim()}%`;

    const results = await db
      .select({
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        image: users.image,
        role: users.role,
      })
      .from(users)
      .where(
        and(
          ne(users.id, session.user.id), // Exclude current user
          eq(users.status, "active"), // Only active users
          or(
            ilike(users.name, searchTerm),
            ilike(users.displayName, searchTerm),
            ilike(users.email, searchTerm)
          )
        )
      )
      .limit(limit);

    return NextResponse.json({ users: results });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { getCreatorApplicationsAdmin } from "@/lib/jobs/queries";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/admin/users/[userId]/applications - Get creator's applications
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId } = await params;

    // Verify user exists
    const [user] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const applications = await getCreatorApplicationsAdmin(userId);

    return NextResponse.json({ applications });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching user applications:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedCreators, users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { isBrand } from "@/lib/roles";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ creatorId: string }>;
}

// DELETE /api/brands/saved-creators/[creatorId] - Unsave a creator
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { creatorId } = await params;

    // Verify user is a brand
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { role: true },
    });

    if (!user || !isBrand(user.role)) {
      return NextResponse.json(
        { error: "Only brands can unsave creators" },
        { status: 403 }
      );
    }

    // Delete the saved creator entry
    const [deleted] = await db
      .delete(savedCreators)
      .where(
        and(
          eq(savedCreators.brandId, session.user.id),
          eq(savedCreators.creatorId, creatorId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Saved creator not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error unsaving creator:", error);
    return NextResponse.json(
      { error: "Failed to unsave creator" },
      { status: 500 }
    );
  }
}

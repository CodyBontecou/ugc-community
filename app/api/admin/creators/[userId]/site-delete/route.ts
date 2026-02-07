import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users, portfolioGenerations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deletePortfolio } from "@/lib/portfolio/storage";

// DELETE /api/admin/creators/[userId]/site-delete — Delete a creator's generated site
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId } = await params;

    // Load user
    const [user] = await db
      .select({
        id: users.id,
        subdomain: users.subdomain,
        siteEnabled: users.siteEnabled,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.subdomain) {
      return NextResponse.json(
        { error: "User does not have a subdomain configured" },
        { status: 400 }
      );
    }

    // 1. Delete all portfolio files from Vercel Blob
    const deletedFiles = await deletePortfolio(user.subdomain);

    // 2. Disable site hosting
    await db
      .update(users)
      .set({
        siteEnabled: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 3. Clean up generation records (mark them as deleted)
    const deletedGenerations = await db
      .delete(portfolioGenerations)
      .where(eq(portfolioGenerations.userId, userId))
      .returning({ id: portfolioGenerations.id });

    return NextResponse.json({
      success: true,
      deletedFiles,
      deletedGenerations: deletedGenerations.length,
      subdomain: user.subdomain,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting site:", error);
    return NextResponse.json({ error: "Failed to delete site" }, { status: 500 });
  }
}

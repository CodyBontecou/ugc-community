import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteUserWithCleanup } from "@/lib/user/cleanup";

// DELETE /api/user/delete-account - Permanently delete the current user's account
export async function DELETE() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Check if user exists
    const existingUser = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user with full cleanup of external resources
    // This handles: Vercel project, GitHub repo, Vercel Blob media files
    // Then deletes the user from DB (cascades handle related DB records)
    const result = await deleteUserWithCleanup(userId);

    if (!result.userDeleted) {
      return NextResponse.json(
        { error: "Failed to delete account from database" },
        { status: 500 }
      );
    }

    // Return success even if some external cleanup failed
    // The user is deleted, external resources can be manually cleaned if needed
    return NextResponse.json({
      success: true,
      cleanup: {
        vercelProject: result.cleanupResult.cleaned.vercelProject,
        githubRepo: result.cleanupResult.cleaned.githubRepo,
        mediaFiles: result.cleanupResult.cleaned.mediaFiles,
        errors: result.cleanupResult.errors.length > 0 ? result.cleanupResult.errors : undefined,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}

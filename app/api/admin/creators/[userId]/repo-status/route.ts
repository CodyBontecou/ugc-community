import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getProject, VercelApiError } from "@/lib/vercel";

// GET /api/admin/creators/[userId]/repo-status - Check current repo linkage status
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

    // Get user with required fields
    const userResult = await db
      .select({
        id: users.id,
        vercelProjectId: users.vercelProjectId,
        githubRepoFullName: users.githubRepoFullName,
        githubRepoId: users.githubRepoId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult[0];

    // If no Vercel project configured, return minimal status
    if (!user.vercelProjectId) {
      return NextResponse.json({
        hasVercelProject: false,
        hasSelectedRepo: !!user.githubRepoFullName,
        selectedRepo: user.githubRepoFullName,
        linkedRepo: null,
        isLinked: false,
      });
    }

    // Fetch project details from Vercel to check current git linkage
    let vercelLinkedRepo: string | null = null;
    let vercelProjectName: string | null = null;

    try {
      const project = await getProject(user.vercelProjectId);
      vercelProjectName = project.name;
      vercelLinkedRepo = project.link?.repo || null;
    } catch (error) {
      // If we can't fetch the project, it might not exist or token lacks permissions
      if (error instanceof VercelApiError && error.statusCode === 404) {
        return NextResponse.json({
          hasVercelProject: true,
          vercelProjectId: user.vercelProjectId,
          vercelProjectNotFound: true,
          hasSelectedRepo: !!user.githubRepoFullName,
          selectedRepo: user.githubRepoFullName,
          linkedRepo: null,
          isLinked: false,
        });
      }
      throw error;
    }

    // Check if the selected repo matches the linked repo
    const isLinked = !!vercelLinkedRepo && vercelLinkedRepo === user.githubRepoFullName;

    return NextResponse.json({
      hasVercelProject: true,
      vercelProjectId: user.vercelProjectId,
      vercelProjectName,
      hasSelectedRepo: !!user.githubRepoFullName,
      selectedRepo: user.githubRepoFullName,
      linkedRepo: vercelLinkedRepo,
      isLinked,
      needsLinking: !!user.githubRepoFullName && !isLinked,
    });
  } catch (error) {
    if (error instanceof VercelApiError) {
      return NextResponse.json(
        { error: `Vercel API error: ${error.message}` },
        { status: error.statusCode >= 500 ? 502 : 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error checking repo status:", error);
    return NextResponse.json({ error: "Failed to check repo status" }, { status: 500 });
  }
}

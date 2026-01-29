import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { linkGitHubRepo, VercelApiError } from "@/lib/vercel";

// POST /api/admin/creators/[userId]/link-repo - Link Vercel project to GitHub repository
export async function POST(
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
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult[0];

    // Validate required fields
    if (!user.vercelProjectId) {
      return NextResponse.json(
        { error: "User does not have a Vercel project ID configured" },
        { status: 400 }
      );
    }

    if (!user.githubRepoFullName) {
      return NextResponse.json(
        { error: "User does not have a GitHub repository selected" },
        { status: 400 }
      );
    }

    // Link the GitHub repository to the Vercel project
    const result = await linkGitHubRepo(user.vercelProjectId, user.githubRepoFullName);

    return NextResponse.json({
      success: true,
      linkedRepo: user.githubRepoFullName,
      vercelProjectId: user.vercelProjectId,
      gitConfig: result,
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
    console.error("Error linking repository:", error);
    return NextResponse.json({ error: "Failed to link repository" }, { status: 500 });
  }
}

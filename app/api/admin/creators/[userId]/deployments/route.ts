import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  listDeployments,
  createDeployment,
  VercelApiError,
} from "@/lib/vercel";

// GET /api/admin/creators/[userId]/deployments - List deployments
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

    // Get user's Vercel project ID
    const userResult = await db
      .select({
        vercelProjectId: users.vercelProjectId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const creator = userResult[0];

    if (!creator.vercelProjectId) {
      return NextResponse.json(
        { error: "No Vercel project configured for this user" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const target = searchParams.get("target") as "production" | "preview" | null;

    const response = await listDeployments(creator.vercelProjectId, {
      limit: Math.min(limit, 50),
      target: target || undefined,
    });

    return NextResponse.json({
      deployments: response.deployments,
      pagination: response.pagination,
    });
  } catch (error) {
    if (error instanceof VercelApiError) {
      if (error.statusCode === 404) {
        return NextResponse.json(
          { error: "Vercel project not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to fetch deployments:", error);
    return NextResponse.json(
      { error: "Failed to fetch deployments" },
      { status: 500 }
    );
  }
}

// POST /api/admin/creators/[userId]/deployments - Trigger a new deployment
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

    // Get user's Vercel project ID and GitHub repo info
    const userResult = await db
      .select({
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

    const creator = userResult[0];

    if (!creator.vercelProjectId) {
      return NextResponse.json(
        { error: "No Vercel project configured for this user" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const target = body.target || "production";

    // Build git source if repo is linked
    let gitSource: { type: "github"; ref: string; repoId: string } | undefined;
    if (creator.githubRepoId) {
      gitSource = {
        type: "github",
        ref: body.ref || "main", // Default to main branch
        repoId: creator.githubRepoId,
      };
    }

    const deployment = await createDeployment(creator.vercelProjectId, {
      target,
      gitSource,
    });

    return NextResponse.json({
      deployment: {
        uid: deployment.uid,
        url: deployment.url,
        state: deployment.state,
        target: deployment.target,
        created: deployment.created,
        inspectorUrl: deployment.inspectorUrl,
      },
    });
  } catch (error) {
    if (error instanceof VercelApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to create deployment:", error);
    return NextResponse.json(
      { error: "Failed to create deployment" },
      { status: 500 }
    );
  }
}

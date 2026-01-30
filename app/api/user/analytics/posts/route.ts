import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { canAccessAdvancedAnalytics } from "@/lib/analytics/access";
import { db } from "@/lib/db";
import { posts, PostMetadata } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/user/analytics/posts - Get post performance metrics
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Check if user has detailed post metrics access
    const hasAccess = await canAccessAdvancedAnalytics(userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Detailed post metrics not available" },
        { status: 403 }
      );
    }

    // Fetch all posts with metadata
    const postsResult = await db
      .select({
        id: posts.id,
        platform: posts.platform,
        postUrl: posts.postUrl,
        postedAt: posts.postedAt,
        metadata: posts.metadata,
      })
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.postedAt));

    // Format response
    const formattedPosts = postsResult.map((post) => {
      const metadata = post.metadata as PostMetadata | null;
      return {
        id: post.id,
        platform: post.platform,
        postUrl: post.postUrl,
        postedAt: post.postedAt?.toISOString() ?? null,
        views: metadata?.views ?? 0,
        likes: metadata?.likes ?? 0,
        comments: metadata?.comments ?? 0,
      };
    });

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching post metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch post metrics" },
      { status: 500 }
    );
  }
}

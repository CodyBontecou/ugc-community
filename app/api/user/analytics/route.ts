import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users, posts, viewHistory, PostMetadata } from "@/lib/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";

// GET /api/user/analytics - Get advanced analytics for authenticated user
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Check if user has advanced analytics access
    const [user] = await db
      .select({
        hasAdvancedAnalytics: users.hasAdvancedAnalytics,
        profileViewCount: users.profileViewCount,
        portfolioViewCount: users.portfolioViewCount,
        lifetimePostCount: users.lifetimePostCount,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.hasAdvancedAnalytics) {
      return NextResponse.json(
        { error: "Advanced analytics not available" },
        { status: 403 }
      );
    }

    // Calculate date range (last 84 days = 12 weeks)
    const now = new Date();
    const eightyfourDaysAgo = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000);
    const startDate = eightyfourDaysAgo.toISOString().split("T")[0];

    // Query view trends - aggregate by ISO week
    const viewTrendsResult = await db
      .select({
        week: sql<string>`to_char(${viewHistory.date}::date, 'IYYY-"W"IW')`,
        profileViews: sql<number>`sum(${viewHistory.profileViews})::int`,
        portfolioViews: sql<number>`sum(${viewHistory.portfolioViews})::int`,
      })
      .from(viewHistory)
      .where(
        and(
          eq(viewHistory.userId, userId),
          gte(viewHistory.date, startDate)
        )
      )
      .groupBy(sql`to_char(${viewHistory.date}::date, 'IYYY-"W"IW')`)
      .orderBy(sql`to_char(${viewHistory.date}::date, 'IYYY-"W"IW')`);

    // Query platform breakdown from posts
    const platformBreakdownResult = await db
      .select({
        platform: posts.platform,
        count: sql<number>`count(*)::int`,
      })
      .from(posts)
      .where(eq(posts.userId, userId))
      .groupBy(posts.platform);

    // Convert to object format
    const platformBreakdown: Record<string, number> = {};
    for (const row of platformBreakdownResult) {
      platformBreakdown[row.platform] = row.count;
    }

    // Query top 5 posts by engagement (views + likes + comments)
    const topPostsResult = await db
      .select({
        id: posts.id,
        platform: posts.platform,
        postUrl: posts.postUrl,
        postedAt: posts.postedAt,
        metadata: posts.metadata,
      })
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(
        desc(
          sql`COALESCE((${posts.metadata}->>'views')::int, 0) +
              COALESCE((${posts.metadata}->>'likes')::int, 0) +
              COALESCE((${posts.metadata}->>'comments')::int, 0)`
        )
      )
      .limit(5);

    // Format response
    const viewTrends = viewTrendsResult.map((row) => ({
      week: row.week,
      profileViews: row.profileViews || 0,
      portfolioViews: row.portfolioViews || 0,
    }));

    const topPosts = topPostsResult.map((post) => ({
      id: post.id,
      platform: post.platform,
      postUrl: post.postUrl,
      postedAt: post.postedAt,
      metadata: post.metadata as PostMetadata,
    }));

    return NextResponse.json({
      viewTrends,
      platformBreakdown,
      topPosts,
      totals: {
        profileViewCount: user.profileViewCount,
        portfolioViewCount: user.portfolioViewCount,
        lifetimePostCount: user.lifetimePostCount,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

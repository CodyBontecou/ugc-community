import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users, contactSubmissions } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getAnalyticsFeatures } from "@/lib/analytics/access";

// GET /api/user/stats - Get current user's stats
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Get user profile and portfolio view counts
    const [userResult] = await db
      .select({
        profileViewCount: users.profileViewCount,
        portfolioViewCount: users.portfolioViewCount,
        subdomain: users.subdomain,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get contact submission counts
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.creatorId, userId));

    const [last30DaysCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactSubmissions)
      .where(and(
        eq(contactSubmissions.creatorId, userId),
        gte(contactSubmissions.createdAt, thirtyDaysAgo)
      ));

    const [last7DaysCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactSubmissions)
      .where(and(
        eq(contactSubmissions.creatorId, userId),
        gte(contactSubmissions.createdAt, sevenDaysAgo)
      ));

    // Get analytics feature access
    const analyticsFeatures = await getAnalyticsFeatures(userId);

    return NextResponse.json({
      profileViewCount: userResult.profileViewCount,
      portfolioViewCount: userResult.portfolioViewCount,
      hasSubdomain: !!userResult.subdomain,
      contactSubmissions: {
        total: Number(totalCount?.count || 0),
        last30Days: Number(last30DaysCount?.count || 0),
        last7Days: Number(last7DaysCount?.count || 0),
      },
      analyticsFeatures,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching user stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

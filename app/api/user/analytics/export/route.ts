import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { canAccessAdvancedAnalytics } from "@/lib/analytics/access";
import { db } from "@/lib/db";
import {
  users,
  posts,
  viewHistory,
  contactSubmissions,
  PostMetadata,
} from "@/lib/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";

type ExportData = {
  exportedAt: string;
  totals: {
    profileViews: number;
    portfolioViews: number;
    lifetimePostCount: number;
    totalContactSubmissions: number;
  };
  viewTrends: Array<{
    week: string;
    profileViews: number;
    portfolioViews: number;
  }>;
  contactSubmissions: Array<{
    date: string;
    senderName: string;
    senderCompany: string;
  }>;
  posts: Array<{
    id: string;
    platform: string;
    postUrl: string | null;
    postedAt: string | null;
    views: number;
    likes: number;
    comments: number;
  }>;
};

// GET /api/user/analytics/export?format=csv|json
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Check if user has data export access
    const hasAccess = await canAccessAdvancedAnalytics(userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Data export not available" },
        { status: 403 }
      );
    }

    const format = request.nextUrl.searchParams.get("format") || "json";
    if (format !== "csv" && format !== "json") {
      return NextResponse.json(
        { error: "Invalid format. Use csv or json" },
        { status: 400 }
      );
    }

    // Fetch user totals
    const [user] = await db
      .select({
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

    // Fetch view trends (last 84 days = 12 weeks)
    const eightyfourDaysAgo = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000);
    const startDate = eightyfourDaysAgo.toISOString().split("T")[0];

    const viewTrendsResult = await db
      .select({
        week: sql<string>`to_char(${viewHistory.date}::date, 'IYYY-"W"IW')`,
        profileViews: sql<number>`sum(${viewHistory.profileViews})::int`,
        portfolioViews: sql<number>`sum(${viewHistory.portfolioViews})::int`,
      })
      .from(viewHistory)
      .where(
        and(eq(viewHistory.userId, userId), gte(viewHistory.date, startDate))
      )
      .groupBy(sql`to_char(${viewHistory.date}::date, 'IYYY-"W"IW')`)
      .orderBy(sql`to_char(${viewHistory.date}::date, 'IYYY-"W"IW')`);

    // Fetch contact submissions (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const contactsResult = await db
      .select({
        createdAt: contactSubmissions.createdAt,
        senderName: contactSubmissions.senderName,
        senderCompany: contactSubmissions.senderCompany,
      })
      .from(contactSubmissions)
      .where(
        and(
          eq(contactSubmissions.creatorId, userId),
          gte(contactSubmissions.createdAt, ninetyDaysAgo)
        )
      )
      .orderBy(desc(contactSubmissions.createdAt));

    // Fetch total contact submissions count
    const [contactCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.creatorId, userId));

    // Fetch all posts with performance data
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

    // Build export data
    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      totals: {
        profileViews: user.profileViewCount,
        portfolioViews: user.portfolioViewCount,
        lifetimePostCount: user.lifetimePostCount,
        totalContactSubmissions: contactCount?.count ?? 0,
      },
      viewTrends: viewTrendsResult.map((row) => ({
        week: row.week,
        profileViews: row.profileViews || 0,
        portfolioViews: row.portfolioViews || 0,
      })),
      contactSubmissions: contactsResult.map((row) => ({
        date: row.createdAt.toISOString().split("T")[0],
        senderName: row.senderName,
        senderCompany: row.senderCompany,
      })),
      posts: postsResult.map((post) => {
        const metadata = post.metadata as PostMetadata | null;
        return {
          id: post.id,
          platform: post.platform,
          postUrl: post.postUrl,
          postedAt: post.postedAt?.toISOString().split("T")[0] ?? null,
          views: metadata?.views ?? 0,
          likes: metadata?.likes ?? 0,
          comments: metadata?.comments ?? 0,
        };
      }),
    };

    if (format === "json") {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="analytics-export-${new Date().toISOString().split("T")[0]}.json"`,
        },
      });
    }

    // CSV format
    const csvLines: string[] = [];

    // Summary section
    csvLines.push("# Summary");
    csvLines.push("Metric,Value");
    csvLines.push(`Exported At,${exportData.exportedAt}`);
    csvLines.push(`Profile Views,${exportData.totals.profileViews}`);
    csvLines.push(`Portfolio Views,${exportData.totals.portfolioViews}`);
    csvLines.push(`Lifetime Post Count,${exportData.totals.lifetimePostCount}`);
    csvLines.push(
      `Total Contact Submissions,${exportData.totals.totalContactSubmissions}`
    );
    csvLines.push("");

    // View trends section
    csvLines.push("# View Trends (Last 12 Weeks)");
    csvLines.push("Week,Profile Views,Portfolio Views");
    for (const trend of exportData.viewTrends) {
      csvLines.push(
        `${trend.week},${trend.profileViews},${trend.portfolioViews}`
      );
    }
    csvLines.push("");

    // Contact submissions section
    csvLines.push("# Contact Submissions (Last 90 Days)");
    csvLines.push("Date,Sender Name,Sender Company");
    for (const contact of exportData.contactSubmissions) {
      csvLines.push(
        `${contact.date},"${contact.senderName.replace(/"/g, '""')}","${contact.senderCompany.replace(/"/g, '""')}"`
      );
    }
    csvLines.push("");

    // Posts section
    csvLines.push("# Posts");
    csvLines.push("ID,Platform,Post URL,Posted At,Views,Likes,Comments");
    for (const post of exportData.posts) {
      csvLines.push(
        `${post.id},${post.platform},"${post.postUrl ?? ""}",${post.postedAt ?? ""},${post.views},${post.likes},${post.comments}`
      );
    }

    return new NextResponse(csvLines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="analytics-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error exporting analytics:", error);
    return NextResponse.json(
      { error: "Failed to export analytics" },
      { status: 500 }
    );
  }
}

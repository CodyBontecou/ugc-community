import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users, hashtagMentions } from "@/lib/db/schema";
import { sql, desc, ilike, eq } from "drizzle-orm";

/**
 * GET /api/admin/monitoring/debug
 *
 * Debug endpoint to check monitoring configuration and recent activity
 */
export async function GET(request: Request) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const handleQuery = url.searchParams.get("handle");

    // Check environment variables
    const config = {
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/hashtag-monitor/apify`,
      hasApifyToken: !!process.env.APIFY_API_TOKEN,
      hasWebhookSecret: !!process.env.APIFY_WEBHOOK_SECRET,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "NOT SET",
    };

    // Get users with Instagram handles
    const usersWithHandles = await db
      .select({
        id: users.id,
        name: users.name,
        instagramHandles: users.instagramHandles,
        tiktokHandles: users.tiktokHandles,
        lifetimePostCount: users.lifetimePostCount,
      })
      .from(users)
      .where(sql`array_length(${users.instagramHandles}, 1) > 0`);

    // Get recent hashtag mentions
    const recentMentions = await db
      .select({
        id: hashtagMentions.id,
        platform: hashtagMentions.platform,
        authorHandle: hashtagMentions.authorHandle,
        matchedUserId: hashtagMentions.matchedUserId,
        discoveredAt: hashtagMentions.discoveredAt,
        postUrl: hashtagMentions.postUrl,
      })
      .from(hashtagMentions)
      .orderBy(desc(hashtagMentions.discoveredAt))
      .limit(10);

    // If searching for a specific handle
    let handleSearch = null;
    if (handleQuery) {
      const normalizedHandle = handleQuery.toLowerCase().replace(/^@/, "");

      // Find user with this handle
      const matchedUser = await db.query.users.findFirst({
        where: sql`EXISTS (
          SELECT 1 FROM unnest(${users.instagramHandles}) AS h
          WHERE lower(h) = ${normalizedHandle}
        )`,
        columns: { id: true, name: true, instagramHandles: true, lifetimePostCount: true },
      });

      // Find mentions from this handle
      const mentionsForHandle = await db
        .select()
        .from(hashtagMentions)
        .where(ilike(hashtagMentions.authorHandle, `%${handleQuery}%`))
        .orderBy(desc(hashtagMentions.discoveredAt))
        .limit(20);

      handleSearch = {
        query: handleQuery,
        normalizedHandle,
        userFound: matchedUser,
        mentionsFound: mentionsForHandle.length,
        mentions: mentionsForHandle.map(m => ({
          platform: m.platform,
          authorHandle: m.authorHandle,
          matchedUserId: m.matchedUserId,
          discoveredAt: m.discoveredAt,
          postUrl: m.postUrl,
          hasHashtag: m.metadata && Array.isArray((m.metadata as Record<string, unknown>).hashtags),
        })),
      };
    }

    return NextResponse.json({
      config,
      usersWithHandles: usersWithHandles.map(u => ({
        name: u.name,
        instagramHandles: u.instagramHandles,
        tiktokHandles: u.tiktokHandles,
        lifetimePostCount: u.lifetimePostCount,
      })),
      recentMentions: recentMentions.map(m => ({
        platform: m.platform,
        authorHandle: m.authorHandle,
        matched: !!m.matchedUserId,
        discoveredAt: m.discoveredAt,
        postUrl: m.postUrl,
      })),
      handleSearch,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in monitoring debug:", error);
    return NextResponse.json(
      { error: "Failed to get debug info" },
      { status: 500 }
    );
  }
}

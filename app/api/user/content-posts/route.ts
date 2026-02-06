import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  hashtagMentions,
  contentJobs,
  HashtagMentionEngagement,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/user/content-posts - Get posts recognized as part of user's contracts
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Fetch all hashtag mentions matched to this user, joined with job info
    const results = await db
      .select({
        id: hashtagMentions.id,
        platform: hashtagMentions.platform,
        postUrl: hashtagMentions.postUrl,
        content: hashtagMentions.content,
        engagement: hashtagMentions.engagement,
        postedAt: hashtagMentions.postedAt,
        discoveredAt: hashtagMentions.discoveredAt,
        matchedHook: hashtagMentions.matchedHook,
        hookMatchConfidence: hashtagMentions.hookMatchConfidence,
        metadata: hashtagMentions.metadata,
        // Job info (may be null if mention wasn't matched to a specific job)
        jobId: contentJobs.id,
        jobTitle: contentJobs.title,
      })
      .from(hashtagMentions)
      .leftJoin(contentJobs, eq(hashtagMentions.matchedJobId, contentJobs.id))
      .where(eq(hashtagMentions.matchedUserId, userId))
      .orderBy(desc(hashtagMentions.postedAt), desc(hashtagMentions.discoveredAt));

    // Format response
    const posts = results.map((row) => {
      const engagement = row.engagement as HashtagMentionEngagement | null;
      return {
        id: row.id,
        platform: row.platform,
        postUrl: row.postUrl,
        content: row.content
          ? row.content.length > 120
            ? row.content.slice(0, 120) + "…"
            : row.content
          : null,
        views: engagement?.views ?? null,
        likes: engagement?.likes ?? null,
        comments: engagement?.comments ?? null,
        shares: engagement?.shares ?? null,
        saves: engagement?.saves ?? null,
        postedAt: row.postedAt?.toISOString() ?? null,
        discoveredAt: row.discoveredAt.toISOString(),
        matchedHook: row.matchedHook,
        confidence: row.hookMatchConfidence,
        jobId: row.jobId,
        jobTitle: row.jobTitle,
        thumbnailUrl: (row.metadata as Record<string, unknown>)?.thumbnailUrl as string | null ?? null,
      };
    });

    return NextResponse.json({
      posts,
      total: posts.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching content posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch content posts" },
      { status: 500 }
    );
  }
}

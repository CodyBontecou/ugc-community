/**
 * Mention-Based Post Matching
 *
 * Instead of AI-based semantic hook matching, we now use a simpler approach:
 * creators tag @ugc.community in their TikTok posts, and we detect those mentions
 * to credit their content against active job posts.
 */

import { db } from "@/lib/db";
import { contentJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface MentionMatchResult {
  matched: boolean;
  jobId: string;
  jobTitle: string;
  matchedHook: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

export interface PostContent {
  caption?: string | null;
  hashtags?: string[];
  platform: string;
}

export interface ActiveJob {
  jobId: string;
  jobTitle: string;
}

/**
 * Mention patterns for @ugc.community across platforms
 */
const MENTION_PATTERNS = [
  /@ugc\.community\b/i, // Instagram, TikTok (with dot)
  /@ugccommunity\b/i, // Without dot/separator
  /@ugc_community\b/i, // Twitter style (underscore)
];

/**
 * Check if post content contains a mention of @ugc.community
 */
export function postContainsMention(
  content: string | undefined | null
): boolean {
  if (!content) return false;

  for (const pattern of MENTION_PATTERNS) {
    if (pattern.test(content)) {
      return true;
    }
  }

  return false;
}

/**
 * Get all active job posts (for associating mentions with jobs)
 */
export async function getActiveJobs(): Promise<ActiveJob[]> {
  const activeJobs = await db
    .select({
      id: contentJobs.id,
      title: contentJobs.title,
    })
    .from(contentJobs)
    .where(eq(contentJobs.status, "active"));

  return activeJobs.map((job) => ({
    jobId: job.id,
    jobTitle: job.title,
  }));
}

/**
 * Match a post to active jobs based on @ugc.community mention.
 *
 * If the post mentions @ugc.community, it's matched to the first active job.
 * This is a simple approach — creators tag us, we credit them.
 */
export async function matchPostByMention(
  postContent: PostContent,
  activeJobs?: ActiveJob[]
): Promise<MentionMatchResult[]> {
  const caption = postContent.caption?.trim();
  if (!caption) return [];

  // Check if the post mentions @ugc.community
  if (!postContainsMention(caption)) return [];

  // Get active jobs if not provided
  const jobs = activeJobs ?? (await getActiveJobs());
  if (jobs.length === 0) return [];

  // Match to the first active job (simple approach)
  const job = jobs[0];

  return [
    {
      matched: true,
      jobId: job.jobId,
      jobTitle: job.jobTitle,
      matchedHook: "@ugc.community mention",
      confidence: "high",
      reasoning: "Post contains @ugc.community mention",
    },
  ];
}

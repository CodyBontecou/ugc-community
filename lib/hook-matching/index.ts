/**
 * Semantic Hook Matching Service
 *
 * Uses Claude to perform fuzzy/semantic matching between
 * TikTok post content (captions, hooks) and job board hooks.
 *
 * When the scraper picks up a creator's post, we check if the
 * content semantically matches any hooks defined in active job posts.
 */

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { contentJobs } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

const anthropic = new Anthropic();

export interface HookMatchResult {
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

export interface ActiveJobHook {
  jobId: string;
  jobTitle: string;
  hooks: string[];
}

/**
 * Get all hooks from active job posts
 */
export async function getActiveJobHooks(): Promise<ActiveJobHook[]> {
  const activeJobs = await db
    .select({
      id: contentJobs.id,
      title: contentJobs.title,
      hooks: contentJobs.hooks,
    })
    .from(contentJobs)
    .where(eq(contentJobs.status, "active"));

  return activeJobs
    .filter((job) => job.hooks && (job.hooks as string[]).length > 0)
    .map((job) => ({
      jobId: job.id,
      jobTitle: job.title,
      hooks: job.hooks as string[],
    }));
}

/**
 * Use Claude to semantically match post content against job hooks.
 *
 * Returns matches sorted by confidence (high first).
 */
export async function matchPostToHooks(
  postContent: PostContent,
  activeJobHooks?: ActiveJobHook[]
): Promise<HookMatchResult[]> {
  // Get active hooks if not provided
  const jobHooks = activeJobHooks ?? (await getActiveJobHooks());

  if (jobHooks.length === 0) {
    return [];
  }

  const caption = postContent.caption?.trim();
  if (!caption) {
    return [];
  }

  // Build the hooks reference for Claude
  const hooksReference = jobHooks
    .map((job) => {
      const hooksList = job.hooks.map((h, i) => `    ${i + 1}. "${h}"`).join("\n");
      return `  Job: "${job.jobTitle}" (ID: ${job.jobId})\n  Hooks:\n${hooksList}`;
    })
    .join("\n\n");

  const hashtagsStr =
    postContent.hashtags && postContent.hashtags.length > 0
      ? `\nHashtags: ${postContent.hashtags.map((h) => `#${h}`).join(" ")}`
      : "";

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a content matching system. Determine if a social media post matches any of the provided hooks from job postings.

A "hook" is a specific phrase, angle, or theme that a creator should use in their content. A match means the post's content conveys the same idea, message, or angle as the hook - it does NOT need to be an exact word-for-word match.

## Active Job Hooks

${hooksReference}

## Post Content

Platform: ${postContent.platform}
Caption: "${caption}"${hashtagsStr}

## Instructions

Analyze if this post matches any of the hooks above. Consider:
- The post doesn't need exact wording - semantic similarity counts
- The post should clearly convey the hook's intended message/angle
- Hashtags can provide additional context
- Be strict about relevance - don't match unrelated content

Respond with a JSON array of matches (empty array if no matches). Each match should have:
- jobId: the job ID
- jobTitle: the job title
- matchedHook: the specific hook that matched
- confidence: "high" (clearly matches), "medium" (likely matches), or "low" (possibly matches)
- reasoning: brief explanation of why it matches

Only include matches with medium or high confidence. Respond with ONLY the JSON array, no other text.`,
        },
      ],
    });

    // Parse Claude's response
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return [];
    }

    const jsonStr = textContent.text.trim();
    // Handle potential markdown code blocks
    const cleanJson = jsonStr
      .replace(/^```json?\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
      .trim();

    const matches: HookMatchResult[] = JSON.parse(cleanJson);

    // Validate and add matched: true
    return matches
      .filter(
        (m) =>
          m.jobId &&
          m.matchedHook &&
          m.confidence &&
          ["high", "medium"].includes(m.confidence)
      )
      .map((m) => ({ ...m, matched: true }));
  } catch (error) {
    console.error("[HookMatching] Error calling Claude for hook matching:", error);
    return [];
  }
}

/**
 * Batch match multiple posts against active hooks.
 * Fetches hooks once and reuses for all posts.
 */
export async function batchMatchPostsToHooks(
  posts: PostContent[]
): Promise<Map<number, HookMatchResult[]>> {
  const jobHooks = await getActiveJobHooks();
  const results = new Map<number, HookMatchResult[]>();

  if (jobHooks.length === 0) {
    return results;
  }

  // Process posts sequentially to avoid rate limits
  for (let i = 0; i < posts.length; i++) {
    const matches = await matchPostToHooks(posts[i], jobHooks);
    if (matches.length > 0) {
      results.set(i, matches);
    }
  }

  return results;
}

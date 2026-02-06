/**
 * Hashtag Monitoring Core Handler
 *
 * Processes incoming posts from any registered provider,
 * saves them to the database, matches to users by social handle,
 * and performs semantic hook matching against active job posts.
 */

import { db } from "@/lib/db";
import { hashtagMentions, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getProvider } from "./index";
import type { ParsedPost, ProcessingResult } from "./types";
import { updateUserPostCount } from "@/lib/milestones";
import { sendMilestoneEarnedEmail } from "@/lib/email";
import {
  matchPostToHooks,
  getActiveJobHooks,
  type HookMatchResult,
  type ActiveJobHook,
} from "@/lib/hook-matching";

// Only process posts from the last N days (to avoid reprocessing old posts)
const MAX_POST_AGE_DAYS = 14;

/**
 * Process incoming posts from a webhook
 *
 * @param providerName - Name of the provider (e.g., "apify")
 * @param payload - Raw webhook payload
 * @param headers - Request headers for verification
 */
export async function processIncomingPosts(
  providerName: string,
  payload: unknown,
  headers?: Record<string, string>
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    success: false,
    savedCount: 0,
    duplicateCount: 0,
    matchedCount: 0,
    errors: [],
  };

  console.log(`[HashtagMonitor] Processing webhook from ${providerName}`);

  // Get the provider
  const provider = getProvider(providerName);
  if (!provider) {
    result.errors.push(`Unknown provider: ${providerName}`);
    return result;
  }

  // Parse the webhook payload
  let parseResult;
  try {
    parseResult = await provider.parseWebhookPayload(payload, headers);
    console.log(
      `[HashtagMonitor] Parsed ${parseResult.posts.length} posts from webhook`
    );
  } catch (error) {
    result.errors.push(
      `Failed to parse webhook: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    console.error(`[HashtagMonitor] Parse error:`, error);
    return result;
  }

  // Add any parsing errors
  if (parseResult.errors) {
    result.errors.push(...parseResult.errors);
    console.log(`[HashtagMonitor] Parse errors:`, parseResult.errors);
  }

  // Filter out old posts to avoid reprocessing
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_POST_AGE_DAYS);

  const filteredPosts = parseResult.posts.filter((post) => {
    if (!post.postedAt) return true;
    return post.postedAt >= cutoffDate;
  });

  const tooOldCount = parseResult.posts.length - filteredPosts.length;

  console.log(
    `[HashtagMonitor] Filtering: ${parseResult.posts.length} total → ${filteredPosts.length} within ${MAX_POST_AGE_DAYS} days`
  );
  if (tooOldCount > 0) {
    console.log(
      `[HashtagMonitor] Skipped ${tooOldCount} posts older than ${MAX_POST_AGE_DAYS} days`
    );
  }

  // Pre-fetch active job hooks once for all posts
  let activeJobHooks: ActiveJobHook[] | undefined;
  try {
    activeJobHooks = await getActiveJobHooks();
    console.log(
      `[HashtagMonitor] Loaded ${activeJobHooks.length} active jobs with hooks`
    );
  } catch (error) {
    console.error(`[HashtagMonitor] Failed to load job hooks:`, error);
    activeJobHooks = [];
  }

  // Process each post
  for (const post of filteredPosts) {
    try {
      const saveResult = await savePost(post, providerName, activeJobHooks);
      if (saveResult.isDuplicate) {
        result.duplicateCount++;
      } else {
        result.savedCount++;
        if (saveResult.matchedUserId) {
          result.matchedCount++;
        }
      }
    } catch (error) {
      result.errors.push(
        `Failed to save post ${post.postUrl}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Save a single post to the database, match to user, and match hooks
 */
async function savePost(
  post: ParsedPost,
  source: string,
  activeJobHooks?: ActiveJobHook[]
): Promise<{
  isDuplicate: boolean;
  matchedUserId: string | null;
  hookMatch: HookMatchResult | null;
}> {
  // Try to match to a user based on their social handles
  const matchedUserId = await matchUserByHandle(
    post.authorHandle,
    post.platform
  );
  console.log(
    `[HashtagMonitor] Saving post from @${post.authorHandle} (${post.platform}) - user matched: ${matchedUserId ? "YES" : "NO"}`
  );

  // Perform semantic hook matching against active job posts
  let hookMatch: HookMatchResult | null = null;
  if (post.content) {
    try {
      const matches = await matchPostToHooks(
        {
          caption: post.content,
          hashtags: post.metadata?.hashtags,
          platform: post.platform,
        },
        activeJobHooks
      );
      // Take the highest confidence match
      if (matches.length > 0) {
        hookMatch = matches[0];
        console.log(
          `[HashtagMonitor] Hook match found! Job: "${hookMatch.jobTitle}" Hook: "${hookMatch.matchedHook}" Confidence: ${hookMatch.confidence}`
        );
      }
    } catch (error) {
      console.error(`[HashtagMonitor] Hook matching error:`, error);
    }
  }

  // Insert or ignore if duplicate (based on unique post_url)
  const inserted = await db
    .insert(hashtagMentions)
    .values({
      platform: post.platform,
      postUrl: post.postUrl,
      postId: post.postId,
      authorHandle: post.authorHandle,
      authorName: post.authorName,
      content: post.content,
      engagement: post.engagement ?? {},
      postedAt: post.postedAt,
      processedAt: matchedUserId ? new Date() : null,
      matchedUserId,
      matchedJobId: hookMatch?.jobId ?? null,
      matchedHook: hookMatch?.matchedHook ?? null,
      hookMatchConfidence: hookMatch?.confidence ?? null,
      source,
      metadata: post.metadata ?? {},
    })
    .onConflictDoNothing({ target: hashtagMentions.postUrl })
    .returning({ id: hashtagMentions.id });

  const isDuplicate = inserted.length === 0;

  // Update user's post count and check milestones if matched and not duplicate
  if (matchedUserId && !isDuplicate && hookMatch) {
    try {
      const { awardedMilestones } = await updateUserPostCount(matchedUserId);

      // Send email notifications for lifetime milestones only
      const lifetimeMilestones = awardedMilestones.filter(
        ({ milestone }) => milestone.type === "lifetime"
      );

      if (lifetimeMilestones.length > 0) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, matchedUserId),
          columns: { email: true, name: true, displayName: true },
        });

        if (user?.email) {
          const creatorName = user.displayName || user.name || "Creator";
          for (const { milestone } of lifetimeMilestones) {
            try {
              await sendMilestoneEarnedEmail({
                creatorEmail: user.email,
                creatorName,
                milestoneName: milestone.name,
                milestoneDescription: milestone.description,
                rewardType: milestone.rewardType,
                threshold: milestone.threshold,
                isMonthly: false,
              });
            } catch (emailError) {
              console.error(
                `Failed to send milestone email for ${milestone.name}:`,
                emailError
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(
        `Failed to update post count for user ${matchedUserId}:`,
        error
      );
    }
  }

  return {
    isDuplicate,
    matchedUserId,
    hookMatch,
  };
}

/**
 * Try to match an author handle to a registered user
 */
async function matchUserByHandle(
  handle: string,
  platform: string
): Promise<string | null> {
  const normalizedHandle = handle.replace(/^@/, "").toLowerCase();

  let matchedUser;

  switch (platform) {
    case "instagram":
      matchedUser = await db.query.users.findFirst({
        where: sql`EXISTS (
          SELECT 1 FROM unnest(${users.instagramHandles}) AS h
          WHERE lower(h) = ${normalizedHandle}
        )`,
        columns: { id: true },
      });
      break;

    case "tiktok":
      matchedUser = await db.query.users.findFirst({
        where: sql`EXISTS (
          SELECT 1 FROM unnest(${users.tiktokHandles}) AS h
          WHERE lower(h) = ${normalizedHandle}
        )`,
        columns: { id: true },
      });
      break;

    case "youtube":
      matchedUser = await db.query.users.findFirst({
        where: sql`EXISTS (
          SELECT 1 FROM unnest(${users.youtubeHandles}) AS h
          WHERE lower(h) = ${normalizedHandle}
        )`,
        columns: { id: true },
      });
      break;

    case "twitter":
      matchedUser = await db.query.users.findFirst({
        where: sql`EXISTS (
          SELECT 1 FROM unnest(${users.twitterHandles}) AS h
          WHERE lower(h) = ${normalizedHandle}
        )`,
        columns: { id: true },
      });
      break;

    default:
      return null;
  }

  return matchedUser?.id ?? null;
}

/**
 * Reprocess unmatched mentions (useful after users add social handles)
 */
export async function reprocessUnmatchedMentions(): Promise<{
  processed: number;
  matched: number;
}> {
  const unmatched = await db.query.hashtagMentions.findMany({
    where: sql`${hashtagMentions.matchedUserId} IS NULL`,
    columns: {
      id: true,
      authorHandle: true,
      platform: true,
    },
  });

  let matched = 0;

  for (const mention of unmatched) {
    const matchedUserId = await matchUserByHandle(
      mention.authorHandle,
      mention.platform
    );

    if (matchedUserId) {
      await db
        .update(hashtagMentions)
        .set({
          matchedUserId,
          processedAt: new Date(),
        })
        .where(eq(hashtagMentions.id, mention.id));
      matched++;
    }
  }

  return {
    processed: unmatched.length,
    matched,
  };
}

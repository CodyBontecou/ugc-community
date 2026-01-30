/**
 * Hashtag Monitoring Core Handler
 *
 * Processes incoming posts from any registered provider,
 * saves them to the database, and attempts to match to users.
 */

import { db } from "@/lib/db";
import { hashtagMentions, users } from "@/lib/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { getProvider } from "./index";
import type { ParsedPost, ProcessingResult } from "./types";
import { updateUserPostCount } from "@/lib/milestones";
import { sendMilestoneEarnedEmail } from "@/lib/email";

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
  } catch (error) {
    result.errors.push(
      `Failed to parse webhook: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return result;
  }

  // Add any parsing errors
  if (parseResult.errors) {
    result.errors.push(...parseResult.errors);
  }

  // Process each post
  for (const post of parseResult.posts) {
    try {
      const saveResult = await savePost(post, providerName);
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
 * Save a single post to the database
 */
async function savePost(
  post: ParsedPost,
  source: string
): Promise<{ isDuplicate: boolean; matchedUserId: string | null }> {
  // Try to match to a user based on their social handles
  const matchedUserId = await matchUserByHandle(post.authorHandle, post.platform);

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
      source,
      metadata: post.metadata ?? {},
    })
    .onConflictDoNothing({ target: hashtagMentions.postUrl })
    .returning({ id: hashtagMentions.id });

  const isDuplicate = inserted.length === 0;

  // Update user's post count and check milestones if matched and not duplicate
  if (matchedUserId && !isDuplicate) {
    try {
      const { awardedMilestones } = await updateUserPostCount(matchedUserId);

      // Send email notifications for newly awarded milestones
      if (awardedMilestones.length > 0) {
        // Fetch user's email and name for notifications
        const user = await db.query.users.findFirst({
          where: eq(users.id, matchedUserId),
          columns: { email: true, name: true, displayName: true },
        });

        if (user?.email) {
          const creatorName = user.displayName || user.name || "Creator";
          for (const { milestone, monthYear } of awardedMilestones) {
            try {
              await sendMilestoneEarnedEmail({
                creatorEmail: user.email,
                creatorName,
                milestoneName: milestone.name,
                milestoneDescription: milestone.description,
                rewardType: milestone.rewardType,
                threshold: milestone.threshold,
                isMonthly: milestone.type === "monthly",
              });
            } catch (emailError) {
              // Log but don't fail - milestone was still awarded
              console.error(`Failed to send milestone email for ${milestone.name}:`, emailError);
            }
          }
        }
      }
    } catch (error) {
      // Log but don't fail the save operation
      console.error(`Failed to update post count for user ${matchedUserId}:`, error);
    }
  }

  return {
    isDuplicate,
    matchedUserId,
  };
}

/**
 * Try to match an author handle to a registered user
 */
async function matchUserByHandle(
  handle: string,
  platform: string
): Promise<string | null> {
  // Normalize handle (remove @ prefix if present)
  const normalizedHandle = handle.replace(/^@/, "").toLowerCase();

  // Build query based on platform
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

    case "facebook":
      // Facebook doesn't have handles array in current schema
      // Could be added later if needed
      return null;

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
  // Get all unmatched mentions
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

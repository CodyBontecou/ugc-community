/**
 * Profile-Based Scraping via Scrape Creators API
 *
 * Directly calls the Scrape Creators REST API for each registered user,
 * using a two-step approach:
 *
 * 1. PEEK: Fetch profile info (1 credit) to check video/post count
 * 2. FETCH: Only if count increased, fetch actual videos/posts
 *
 * This replaces the old Apify actor-based approach and eliminates
 * the need for webhooks entirely.
 */

import { db } from "@/lib/db";
import { users, hashtagMentions } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import {
  getTikTokProfile,
  getTikTokProfileVideos,
  getInstagramProfile,
  getInstagramPosts,
  getYouTubeChannel,
  getYouTubeChannelShorts,
  type TikTokVideoItem,
  type InstagramPostItem,
  type YouTubeShortItem,
} from "./providers/scrapecreators";
import type { ParsedPost } from "./types";

type SupportedPlatform = "instagram" | "tiktok" | "youtube";

export interface ScrapeResult {
  platform: SupportedPlatform;
  handle: string;
  userId: string;
  skipped: boolean;
  skipReason?: string;
  postsFound: number;
  newPosts: ParsedPost[];
  error?: string;
}

export interface PlatformScrapeResult {
  platform: SupportedPlatform;
  totalHandles: number;
  scraped: number;
  skipped: number;
  postsFound: number;
  errors: string[];
  results: ScrapeResult[];
}

export interface PlatformHandles {
  platform: SupportedPlatform;
  handles: Array<{ userId: string; handle: string }>;
}

/**
 * Get all registered user handles for a specific platform, along with their user ID
 * and last-known counts for the peek optimization.
 */
export async function getUserHandlesWithCounts(
  platform: SupportedPlatform
): Promise<
  Array<{
    userId: string;
    handle: string;
    lastKnownCount: number | null;
  }>
> {
  const columnMap = {
    instagram: users.instagramHandles,
    tiktok: users.tiktokHandles,
    youtube: users.youtubeHandles,
  } as const;

  const countColumnMap = {
    instagram: users.lastKnownInstagramPostCount,
    tiktok: users.lastKnownTiktokVideoCount,
    youtube: users.lastKnownYoutubeVideoCount,
  } as const;

  const column = columnMap[platform];
  const countColumn = countColumnMap[platform];

  const result = await db
    .select({
      id: users.id,
      handles: column,
      lastKnownCount: countColumn,
    })
    .from(users)
    .where(sql`array_length(${column}, 1) > 0`);

  // Flatten: one entry per handle (a user can have multiple handles)
  const entries: Array<{
    userId: string;
    handle: string;
    lastKnownCount: number | null;
  }> = [];

  for (const row of result) {
    for (const handle of row.handles ?? []) {
      entries.push({
        userId: row.id,
        handle,
        lastKnownCount: row.lastKnownCount,
      });
    }
  }

  return entries;
}

/**
 * Get handles for all supported platforms (used by admin info endpoint)
 */
export async function getAllPlatformHandles(): Promise<PlatformHandles[]> {
  const platforms: SupportedPlatform[] = ["tiktok", "instagram", "youtube"];
  const results: PlatformHandles[] = [];

  for (const platform of platforms) {
    const entries = await getUserHandlesWithCounts(platform);
    if (entries.length > 0) {
      results.push({
        platform,
        handles: entries.map((e) => ({ userId: e.userId, handle: e.handle })),
      });
    }
  }

  return results;
}

// ─── TikTok Scraping ──────────────────────────────────────────

/**
 * Scrape a single TikTok profile using the peek-then-fetch pattern
 */
async function scrapeTikTokProfile(
  userId: string,
  handle: string,
  lastKnownCount: number | null
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    platform: "tiktok",
    handle,
    userId,
    skipped: false,
    postsFound: 0,
    newPosts: [],
  };

  try {
    // Step 1: PEEK — check video count (1 credit)
    const profile = await getTikTokProfile(handle);
    const currentVideoCount = profile.stats.videoCount;

    console.log(
      `[ScrapeCreators] TikTok @${handle}: ${currentVideoCount} videos (last known: ${lastKnownCount ?? "none"})`
    );

    // Update the last-known count in DB
    await db
      .update(users)
      .set({
        lastKnownTiktokVideoCount: currentVideoCount,
        lastScrapedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Skip if no new videos
    if (lastKnownCount !== null && currentVideoCount <= lastKnownCount) {
      result.skipped = true;
      result.skipReason = `No new videos (count: ${currentVideoCount}, last known: ${lastKnownCount})`;
      console.log(`[ScrapeCreators] TikTok @${handle}: Skipped — no new videos`);
      return result;
    }

    // Step 2: FETCH — get recent videos
    const videosResponse = await getTikTokProfileVideos(handle);
    const videos = videosResponse.aweme_list || [];
    result.postsFound = videos.length;

    console.log(
      `[ScrapeCreators] TikTok @${handle}: Fetched ${videos.length} videos`
    );

    // Convert to ParsedPost format
    for (const video of videos) {
      const post = parseTikTokVideo(video, handle, profile.user.nickname);
      if (post) {
        result.newPosts.push(post);
      }
    }
  } catch (error) {
    result.error =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[ScrapeCreators] TikTok @${handle} error:`, error);
  }

  return result;
}

/**
 * Convert a Scrape Creators TikTok video to ParsedPost
 */
function parseTikTokVideo(
  video: TikTokVideoItem,
  handle: string,
  nickname: string
): ParsedPost | null {
  const videoId = video.aweme_id;
  if (!videoId) return null;

  const postUrl =
    video.url ||
    `https://www.tiktok.com/@${handle}/video/${videoId}`;

  // Extract hashtags from cha_list or text_extra
  const hashtags: string[] = [];
  if (video.cha_list) {
    for (const tag of video.cha_list) {
      if (tag.cha_name) hashtags.push(tag.cha_name);
    }
  }
  if (video.text_extra) {
    for (const extra of video.text_extra) {
      if (extra.hashtag_name && !hashtags.includes(extra.hashtag_name)) {
        hashtags.push(extra.hashtag_name);
      }
    }
  }

  const coverUrl = video.video?.cover?.url_list?.[0];

  return {
    platform: "tiktok",
    postUrl,
    postId: videoId,
    authorHandle: video.author?.unique_id || handle,
    authorName: video.author?.nickname || nickname,
    content: video.desc,
    engagement: {
      likes: video.statistics?.digg_count,
      views: video.statistics?.play_count,
      comments: video.statistics?.comment_count,
      shares: video.statistics?.share_count,
      saves: video.statistics?.collect_count,
    },
    postedAt: video.create_time
      ? new Date(video.create_time * 1000)
      : video.create_time_utc
        ? new Date(video.create_time_utc)
        : undefined,
    metadata: {
      hashtags: hashtags.length > 0 ? hashtags : undefined,
      thumbnailUrl: coverUrl,
      duration: video.video?.duration,
      isVerified: video.author?.verification_type === 1,
      followerCount: video.author?.follower_count,
    },
  };
}

// ─── Instagram Scraping ───────────────────────────────────────

/**
 * Scrape a single Instagram profile using the peek-then-fetch pattern
 */
async function scrapeInstagramProfile(
  userId: string,
  handle: string,
  lastKnownCount: number | null
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    platform: "instagram",
    handle,
    userId,
    skipped: false,
    postsFound: 0,
    newPosts: [],
  };

  try {
    // Step 1: PEEK — check post count (1 credit)
    const profile = await getInstagramProfile(handle);
    const currentPostCount = profile.media_count;

    console.log(
      `[ScrapeCreators] Instagram @${handle}: ${currentPostCount} posts (last known: ${lastKnownCount ?? "none"})`
    );

    // Update the last-known count in DB
    await db
      .update(users)
      .set({
        lastKnownInstagramPostCount: currentPostCount,
        lastScrapedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Skip if no new posts
    if (lastKnownCount !== null && currentPostCount <= lastKnownCount) {
      result.skipped = true;
      result.skipReason = `No new posts (count: ${currentPostCount}, last known: ${lastKnownCount})`;
      console.log(
        `[ScrapeCreators] Instagram @${handle}: Skipped — no new posts`
      );
      return result;
    }

    // Step 2: FETCH — get recent posts
    const postsResponse = await getInstagramPosts(handle);
    const posts = postsResponse.items || [];
    result.postsFound = posts.length;

    console.log(
      `[ScrapeCreators] Instagram @${handle}: Fetched ${posts.length} posts`
    );

    // Convert to ParsedPost format
    for (const post of posts) {
      const parsed = parseInstagramPost(post, handle, profile.full_name);
      if (parsed) {
        result.newPosts.push(parsed);
      }
    }
  } catch (error) {
    result.error =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[ScrapeCreators] Instagram @${handle} error:`, error);
  }

  return result;
}

/**
 * Convert a Scrape Creators Instagram post to ParsedPost
 */
function parseInstagramPost(
  post: InstagramPostItem,
  handle: string,
  fullName: string
): ParsedPost | null {
  // Instagram's internal API uses "code" as the shortcode
  const shortcode = post.code;
  if (!shortcode) return null;

  const postUrl = `https://www.instagram.com/p/${shortcode}/`;

  // Extract caption text
  const caption = post.caption?.text || "";

  // Extract hashtags from caption
  const hashtagMatches = caption.match(/#(\w+)/g);
  const hashtags = hashtagMatches
    ? hashtagMatches.map((h) => h.replace("#", ""))
    : undefined;

  // Get the best thumbnail URL
  const thumbnailUrl = post.image_versions2?.candidates?.[0]?.url;

  // Get author from user or owner objects
  const authorHandle = post.user?.username || post.owner?.username || handle;
  const authorName = post.user?.full_name || post.owner?.full_name || fullName;

  return {
    platform: "instagram",
    postUrl,
    postId: post.id || shortcode,
    authorHandle,
    authorName,
    content: caption,
    engagement: {
      likes: post.like_count,
      comments: post.comment_count,
      views: post.play_count,
    },
    postedAt: post.taken_at
      ? new Date(post.taken_at * 1000)
      : undefined,
    metadata: {
      hashtags,
      thumbnailUrl,
    },
  };
}

// ─── YouTube Scraping ─────────────────────────────────────────

/**
 * Scrape a single YouTube channel's shorts using the peek-then-fetch pattern
 */
async function scrapeYouTubeProfile(
  userId: string,
  handle: string,
  lastKnownCount: number | null
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    platform: "youtube",
    handle,
    userId,
    skipped: false,
    postsFound: 0,
    newPosts: [],
  };

  try {
    // Strip @ prefix if present for display
    const cleanHandle = handle.replace(/^@/, "");

    // Step 1: PEEK — check video count (1 credit)
    const channel = await getYouTubeChannel(cleanHandle);
    const currentVideoCount = channel.videoCount;

    console.log(
      `[ScrapeCreators] YouTube @${cleanHandle}: ${currentVideoCount} videos (last known: ${lastKnownCount ?? "none"})`
    );

    // Update the last-known count in DB
    await db
      .update(users)
      .set({
        lastKnownYoutubeVideoCount: currentVideoCount,
        lastScrapedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Skip if no new videos
    // Note: videoCount includes ALL videos (not just shorts), so this may
    // trigger unnecessary fetches when regular videos are uploaded. This is
    // acceptable — the alternative costs more credits.
    if (lastKnownCount !== null && currentVideoCount <= lastKnownCount) {
      result.skipped = true;
      result.skipReason = `No new videos (count: ${currentVideoCount}, last known: ${lastKnownCount})`;
      console.log(
        `[ScrapeCreators] YouTube @${cleanHandle}: Skipped — no new videos`
      );
      return result;
    }

    // Step 2: FETCH — get recent shorts (first page only, ~48 shorts)
    const shortsResponse = await getYouTubeChannelShorts(cleanHandle);
    const shorts = shortsResponse.shorts || [];
    result.postsFound = shorts.length;

    console.log(
      `[ScrapeCreators] YouTube @${cleanHandle}: Fetched ${shorts.length} shorts`
    );

    // Convert to ParsedPost format
    for (const short of shorts) {
      const post = parseYouTubeShort(short, cleanHandle, channel.name);
      if (post) {
        result.newPosts.push(post);
      }
    }
  } catch (error) {
    result.error =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[ScrapeCreators] YouTube @${handle} error:`, error);
  }

  return result;
}

/**
 * Convert a Scrape Creators YouTube short to ParsedPost
 */
function parseYouTubeShort(
  short: YouTubeShortItem,
  handle: string,
  channelName: string
): ParsedPost | null {
  if (!short.id) return null;

  return {
    platform: "youtube",
    postUrl: short.url,
    postId: short.id,
    authorHandle: handle,
    authorName: channelName,
    // Shorts endpoint returns null for description, so use title for content
    content: short.title,
    engagement: {
      views: short.viewCountInt,
      likes: short.likeCountInt,
      comments: short.commentCountInt,
    },
    postedAt: short.publishDate ? new Date(short.publishDate) : undefined,
  };
}

// ─── Orchestration ────────────────────────────────────────────

/**
 * Scrape all profiles for a given platform
 */
export async function scrapeAllProfiles(
  platform: SupportedPlatform
): Promise<PlatformScrapeResult> {
  const entries = await getUserHandlesWithCounts(platform);

  const platformResult: PlatformScrapeResult = {
    platform,
    totalHandles: entries.length,
    scraped: 0,
    skipped: 0,
    postsFound: 0,
    errors: [],
    results: [],
  };

  for (const entry of entries) {
    let result: ScrapeResult;

    switch (platform) {
      case "tiktok":
        result = await scrapeTikTokProfile(
          entry.userId,
          entry.handle,
          entry.lastKnownCount
        );
        break;
      case "instagram":
        result = await scrapeInstagramProfile(
          entry.userId,
          entry.handle,
          entry.lastKnownCount
        );
        break;
      case "youtube":
        result = await scrapeYouTubeProfile(
          entry.userId,
          entry.handle,
          entry.lastKnownCount
        );
        break;
    }

    platformResult.results.push(result);

    if (result.skipped) {
      platformResult.skipped++;
    } else {
      platformResult.scraped++;
      platformResult.postsFound += result.postsFound;
    }

    if (result.error) {
      platformResult.errors.push(
        `${platform}/@${entry.handle}: ${result.error}`
      );
    }
  }

  return platformResult;
}

/**
 * Scrape all platforms — main entry point for cron/admin trigger
 */
export async function scrapeAllPlatforms(): Promise<PlatformScrapeResult[]> {
  const platforms: SupportedPlatform[] = ["tiktok", "instagram", "youtube"];
  const results: PlatformScrapeResult[] = [];

  for (const platform of platforms) {
    console.log(`[ScrapeCreators] Starting ${platform} scrape...`);
    const result = await scrapeAllProfiles(platform);
    results.push(result);
    console.log(
      `[ScrapeCreators] ${platform} complete: ${result.scraped} scraped, ${result.skipped} skipped, ${result.postsFound} posts found`
    );
  }

  return results;
}

/**
 * Check if a post contains the required hashtag
 */
export function postContainsHashtag(
  content: string | undefined | null,
  hashtags: string[] | undefined | null,
  targetHashtag: string = "ugccommunity"
): boolean {
  const normalizedTarget = targetHashtag.toLowerCase().replace(/^#/, "");

  if (hashtags && Array.isArray(hashtags)) {
    const hasHashtag = hashtags.some(
      (h) => h.toLowerCase().replace(/^#/, "") === normalizedTarget
    );
    if (hasHashtag) return true;
  }

  if (content) {
    const hashtagRegex = new RegExp(`#${normalizedTarget}\\b`, "i");
    return hashtagRegex.test(content);
  }

  return false;
}

/**
 * Check if a post mentions the @ugc.community account
 */
export function postContainsMention(
  content: string | undefined | null,
): boolean {
  if (!content) return false;

  const mentionPatterns = [
    /@ugc\.community\b/i,
    /@ugccommunity\b/i,
    /@ugc_community\b/i,
  ];

  for (const pattern of mentionPatterns) {
    if (pattern.test(content)) {
      return true;
    }
  }

  return false;
}

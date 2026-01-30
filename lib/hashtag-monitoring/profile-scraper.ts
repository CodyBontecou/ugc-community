/**
 * Profile-Based Scraping for Apify
 *
 * Triggers Apify profile scrapers for registered platform users,
 * then filters results for posts containing #ugccommunity.
 *
 * This is more efficient than hashtag scraping when you only want
 * to monitor posts from users registered on your platform.
 */

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

const APIFY_API_BASE = "https://api.apify.com/v2";

// Apify actor IDs for profile scrapers
const PROFILE_SCRAPER_ACTORS = {
  instagram: "apify/instagram-profile-scraper",
  tiktok: "clockworks/free-tiktok-scraper",
} as const;

type SupportedPlatform = keyof typeof PROFILE_SCRAPER_ACTORS;

export interface PlatformHandles {
  platform: SupportedPlatform;
  handles: string[];
}

export interface TriggerResult {
  platform: SupportedPlatform;
  success: boolean;
  runId?: string;
  error?: string;
}

/**
 * Get all registered user handles for a specific platform
 */
export async function getUserHandlesByPlatform(
  platform: SupportedPlatform
): Promise<string[]> {
  const columnMap = {
    instagram: users.instagramHandles,
    tiktok: users.tiktokHandles,
  } as const;

  const column = columnMap[platform];
  if (!column) {
    return [];
  }

  // Get all users with handles for this platform
  const result = await db
    .select({ handles: column })
    .from(users)
    .where(sql`array_length(${column}, 1) > 0`);

  // Flatten and deduplicate handles
  const allHandles = result.flatMap((r) => r.handles ?? []);
  return [...new Set(allHandles)];
}

/**
 * Get handles for all supported platforms
 */
export async function getAllPlatformHandles(): Promise<PlatformHandles[]> {
  const platforms: SupportedPlatform[] = ["instagram", "tiktok"];
  const results: PlatformHandles[] = [];

  for (const platform of platforms) {
    const handles = await getUserHandlesByPlatform(platform);
    if (handles.length > 0) {
      results.push({ platform, handles });
    }
  }

  return results;
}

/**
 * Build Apify actor input for Instagram profile scraper
 */
function buildInstagramInput(handles: string[]): Record<string, unknown> {
  return {
    usernames: handles,
    resultsLimit: 20, // Last 20 posts per user
    addParentData: false,
  };
}

/**
 * Build Apify actor input for TikTok profile scraper
 */
function buildTikTokInput(handles: string[]): Record<string, unknown> {
  return {
    profiles: handles.map((h) => `https://www.tiktok.com/@${h}`),
    resultsPerPage: 20, // Last 20 posts per user
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
  };
}

/**
 * Trigger an Apify profile scraper run
 */
export async function triggerProfileScraper(
  platform: SupportedPlatform,
  handles: string[]
): Promise<TriggerResult> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return {
      platform,
      success: false,
      error: "APIFY_API_TOKEN environment variable is not set",
    };
  }

  if (handles.length === 0) {
    return {
      platform,
      success: false,
      error: "No handles provided",
    };
  }

  const actorId = PROFILE_SCRAPER_ACTORS[platform];
  // Apify API requires tilde (~) instead of slash (/) for namespaced actor IDs in URLs
  const encodedActorId = actorId.replace("/", "~");
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/hashtag-monitor/apify`;

  // Build platform-specific input
  let input: Record<string, unknown>;
  switch (platform) {
    case "instagram":
      input = buildInstagramInput(handles);
      break;
    case "tiktok":
      input = buildTikTokInput(handles);
      break;
    default:
      return {
        platform,
        success: false,
        error: `Unsupported platform: ${platform}`,
      };
  }

  try {
    // Build webhook configuration for this run
    // Apify requires webhooks as a base64-encoded JSON array in query params
    const webhookConfig = [
      {
        eventTypes: ["ACTOR.RUN.SUCCEEDED"],
        requestUrl: webhookUrl,
        payloadTemplate: JSON.stringify({
          eventType: "ACTOR.RUN.SUCCEEDED",
          eventData: {
            actorId: "{{actorId}}",
            actorRunId: "{{actorRunId}}",
          },
          resource: {
            defaultDatasetId: "{{defaultDatasetId}}",
          },
        }),
        headersTemplate: JSON.stringify({
          "X-Apify-Webhook-Secret": process.env.APIFY_WEBHOOK_SECRET || "",
        }),
      },
    ];
    const webhooksParam = Buffer.from(JSON.stringify(webhookConfig)).toString("base64");

    // Start actor run with webhook as query parameter
    const response = await fetch(
      `${APIFY_API_BASE}/acts/${encodedActorId}/runs?token=${token}&webhooks=${webhooksParam}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        platform,
        success: false,
        error: `Apify API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      platform,
      success: true,
      runId: data.data?.id,
    };
  } catch (error) {
    return {
      platform,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Trigger profile scrapers for all platforms with registered users
 */
export async function triggerAllProfileScrapers(): Promise<TriggerResult[]> {
  const platformHandles = await getAllPlatformHandles();
  const results: TriggerResult[] = [];

  for (const { platform, handles } of platformHandles) {
    const result = await triggerProfileScraper(platform, handles);
    results.push(result);
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

  // Check hashtags array first (more reliable)
  if (hashtags && Array.isArray(hashtags)) {
    const hasHashtag = hashtags.some(
      (h) => h.toLowerCase().replace(/^#/, "") === normalizedTarget
    );
    if (hasHashtag) return true;
  }

  // Fallback: check content for hashtag mention
  if (content) {
    const hashtagRegex = new RegExp(`#${normalizedTarget}\\b`, "i");
    return hashtagRegex.test(content);
  }

  return false;
}

/**
 * Apify Hashtag Monitoring Provider
 *
 * Parses webhook payloads from Apify actors that monitor hashtags
 * across multiple social media platforms.
 *
 * Supported Actors:
 * - Instagram: apify/instagram-hashtag-scraper
 * - TikTok: clockworks/tiktok-scraper (or clockworks/tiktok-hashtag-scraper)
 * - Twitter/X: apidojo/tweet-scraper
 * - YouTube: streamers/youtube-scraper
 * - Facebook: apify/facebook-posts-scraper
 *
 * Webhook Flow:
 * 1. Apify sends notification with resource.defaultDatasetId when actor completes
 * 2. Provider fetches actual results from Apify datasets API
 * 3. Results are normalized to ParsedPost format
 */

import { registerProvider } from "../index";
import type {
  HashtagMonitoringProvider,
  ParsedPost,
  ParseResult,
  Platform,
} from "../types";

const APIFY_API_BASE = "https://api.apify.com/v2";

/**
 * Apify webhook payload structure
 * Sent when an actor run completes
 */
interface ApifyWebhookPayload {
  userId?: string;
  createdAt?: string;
  eventType?: string;
  eventData?: {
    actorId?: string;
    actorRunId?: string;
    status?: string;
  };
  resource?: {
    defaultDatasetId?: string;
  };
  // Some actors send results directly in payload
  items?: unknown[];
}

/**
 * Detect platform from actor ID or payload structure
 */
function detectPlatform(
  actorId?: string,
  sampleItem?: Record<string, unknown>
): Platform | null {
  // First try to detect from actor ID
  if (actorId) {
    const actorLower = actorId.toLowerCase();
    if (actorLower.includes("instagram")) return "instagram";
    if (actorLower.includes("tiktok")) return "tiktok";
    if (actorLower.includes("tweet") || actorLower.includes("twitter"))
      return "twitter";
    if (actorLower.includes("youtube")) return "youtube";
    if (actorLower.includes("facebook")) return "facebook";
  }

  // Fallback: detect from payload structure
  if (sampleItem) {
    // Instagram: has ownerUsername and shortCode
    if ("ownerUsername" in sampleItem && "shortCode" in sampleItem) {
      return "instagram";
    }
    // TikTok: has authorMeta and diggCount
    if ("authorMeta" in sampleItem || "diggCount" in sampleItem) {
      return "tiktok";
    }
    // Twitter: has screen_name in user object or tweet-like structure
    if (
      ("user" in sampleItem &&
        typeof sampleItem.user === "object" &&
        sampleItem.user !== null &&
        "screen_name" in (sampleItem.user as object)) ||
      "full_text" in sampleItem ||
      "retweetCount" in sampleItem
    ) {
      return "twitter";
    }
    // YouTube: has channelName and viewCount
    if ("channelName" in sampleItem && "viewCount" in sampleItem) {
      return "youtube";
    }
    // Facebook: has pageName or facebookUrl
    if ("pageName" in sampleItem || "facebookUrl" in sampleItem) {
      return "facebook";
    }
  }

  return null;
}

/**
 * Instagram post structure from apify/instagram-hashtag-scraper
 *
 * Key fields:
 * - id: Post ID
 * - shortCode: Instagram shortcode (used in URL)
 * - ownerUsername: Author's username
 * - ownerFullName: Author's display name
 * - caption: Post caption text
 * - likesCount: Number of likes (-1 if hidden)
 * - commentsCount: Number of comments
 * - videoViewCount: Views for video posts
 * - timestamp: Unix timestamp
 * - hashtags: Array of hashtags
 * - url: Direct post URL
 * - displayUrl: Image/thumbnail URL
 * - type: "Image", "Video", "Sidecar"
 */
interface InstagramPost {
  id?: string;
  shortCode?: string;
  ownerUsername?: string;
  ownerFullName?: string;
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  videoViewCount?: number;
  timestamp?: string | number;
  hashtags?: string[];
  url?: string;
  displayUrl?: string;
  type?: string;
  isVerified?: boolean;
  followersCount?: number;
}

function parseInstagramPost(item: InstagramPost): ParsedPost | null {
  const handle = item.ownerUsername;
  if (!handle) return null;

  const postUrl =
    item.url || `https://www.instagram.com/p/${item.shortCode || item.id}/`;

  return {
    platform: "instagram",
    postUrl,
    postId: item.id || item.shortCode,
    authorHandle: handle,
    authorName: item.ownerFullName,
    content: item.caption,
    engagement: {
      likes: item.likesCount !== -1 ? item.likesCount : undefined,
      comments: item.commentsCount,
      views: item.videoViewCount,
    },
    postedAt: item.timestamp
      ? new Date(
          typeof item.timestamp === "number"
            ? item.timestamp * 1000
            : item.timestamp
        )
      : undefined,
    metadata: {
      hashtags: item.hashtags,
      thumbnailUrl: item.displayUrl,
      isVerified: item.isVerified,
      followerCount: item.followersCount,
    },
  };
}

/**
 * TikTok post structure from clockworks/tiktok-scraper
 *
 * Key fields:
 * - id: Video ID
 * - text: Video caption/description
 * - webVideoUrl: Direct URL to video
 * - authorMeta: { name, nickName, verified, signature, ... }
 * - videoMeta: { duration, coverUrl, ... }
 * - musicMeta: { musicName, musicAuthor, ... }
 * - diggCount: Likes
 * - shareCount: Shares
 * - playCount: Views
 * - commentCount: Comments
 * - collectCount: Saves/bookmarks
 * - createTimeISO: ISO timestamp
 */
interface TikTokPost {
  id?: string;
  text?: string;
  webVideoUrl?: string;
  authorMeta?: {
    name?: string;
    nickName?: string;
    verified?: boolean;
    signature?: string;
    fans?: number;
  };
  videoMeta?: {
    duration?: number;
    coverUrl?: string;
  };
  diggCount?: number;
  shareCount?: number;
  playCount?: number;
  commentCount?: number;
  collectCount?: number;
  createTimeISO?: string;
  createTime?: number;
  hashtags?: Array<{ name?: string }>;
}

function parseTikTokPost(item: TikTokPost): ParsedPost | null {
  const handle = item.authorMeta?.name;
  if (!handle) return null;

  const postUrl =
    item.webVideoUrl || `https://www.tiktok.com/@${handle}/video/${item.id}`;

  // Extract hashtag names from hashtag objects
  const hashtags = item.hashtags
    ?.map((h) => h.name)
    .filter((n): n is string => !!n);

  return {
    platform: "tiktok",
    postUrl,
    postId: item.id,
    authorHandle: handle,
    authorName: item.authorMeta?.nickName,
    content: item.text,
    engagement: {
      likes: item.diggCount,
      views: item.playCount,
      comments: item.commentCount,
      shares: item.shareCount,
      saves: item.collectCount,
    },
    postedAt: item.createTimeISO
      ? new Date(item.createTimeISO)
      : item.createTime
        ? new Date(item.createTime * 1000)
        : undefined,
    metadata: {
      hashtags,
      thumbnailUrl: item.videoMeta?.coverUrl,
      duration: item.videoMeta?.duration,
      isVerified: item.authorMeta?.verified,
      followerCount: item.authorMeta?.fans,
    },
  };
}

/**
 * Twitter/X post structure from apidojo/tweet-scraper
 *
 * Key fields:
 * - id_str or id: Tweet ID
 * - full_text or text: Tweet content
 * - user: { screen_name, name, verified, followers_count }
 * - retweet_count: Retweets
 * - favorite_count: Likes
 * - reply_count: Replies
 * - quote_count: Quote tweets
 * - created_at: Timestamp string
 * - entities: { hashtags: [{ text }], urls, media }
 *
 * Note: Some scrapers use different field names (e.g., retweetCount vs retweet_count)
 */
interface TwitterPost {
  id_str?: string;
  id?: string | number;
  full_text?: string;
  text?: string;
  user?: {
    screen_name?: string;
    name?: string;
    verified?: boolean;
    followers_count?: number;
  };
  // Alternative flat structure some scrapers use
  username?: string;
  displayName?: string;
  isVerified?: boolean;
  followersCount?: number;
  retweet_count?: number;
  retweetCount?: number;
  favorite_count?: number;
  favoriteCount?: number;
  likeCount?: number;
  reply_count?: number;
  replyCount?: number;
  quote_count?: number;
  quoteCount?: number;
  viewCount?: number;
  created_at?: string;
  createdAt?: string;
  timestamp?: string | number;
  entities?: {
    hashtags?: Array<{ text?: string }>;
  };
  hashtags?: string[];
  url?: string;
  tweetUrl?: string;
}

function parseTwitterPost(item: TwitterPost): ParsedPost | null {
  // Handle both nested user object and flat structure
  const handle = item.user?.screen_name || item.username;
  if (!handle) return null;

  const tweetId = String(item.id_str || item.id || "");
  const postUrl =
    item.url ||
    item.tweetUrl ||
    (tweetId ? `https://twitter.com/${handle}/status/${tweetId}` : null);

  if (!postUrl) return null;

  // Extract hashtags from entities or direct array
  const hashtags =
    item.hashtags ||
    item.entities?.hashtags?.map((h) => h.text).filter((t): t is string => !!t);

  // Parse timestamp from various formats
  let postedAt: Date | undefined;
  if (item.created_at) {
    postedAt = new Date(item.created_at);
  } else if (item.createdAt) {
    postedAt = new Date(item.createdAt);
  } else if (item.timestamp) {
    postedAt = new Date(
      typeof item.timestamp === "number"
        ? item.timestamp * 1000
        : item.timestamp
    );
  }

  return {
    platform: "twitter",
    postUrl,
    postId: tweetId,
    authorHandle: handle,
    authorName: item.user?.name || item.displayName,
    content: item.full_text || item.text,
    engagement: {
      likes: item.favorite_count ?? item.favoriteCount ?? item.likeCount,
      views: item.viewCount,
      comments: item.reply_count ?? item.replyCount,
      shares:
        (item.retweet_count ?? item.retweetCount ?? 0) +
        (item.quote_count ?? item.quoteCount ?? 0),
    },
    postedAt,
    metadata: {
      hashtags,
      isVerified: item.user?.verified ?? item.isVerified,
      followerCount: item.user?.followers_count ?? item.followersCount,
    },
  };
}

/**
 * YouTube video structure from streamers/youtube-scraper
 *
 * Key fields:
 * - id: Video ID
 * - title: Video title
 * - url: Video URL
 * - viewCount: Number of views
 * - likes: Like count
 * - date: Upload date
 * - channelName: Channel name
 * - channelUrl: Channel URL
 * - numberOfSubscribers: Channel subscriber count
 * - details: Video description
 * - duration: Video duration in seconds
 */
interface YouTubePost {
  id?: string;
  title?: string;
  url?: string;
  viewCount?: number;
  likes?: number;
  likeCount?: number;
  commentCount?: number;
  date?: string;
  uploadDate?: string;
  channelName?: string;
  channelUrl?: string;
  channelHandle?: string;
  numberOfSubscribers?: number;
  subscriberCount?: number;
  details?: string;
  description?: string;
  duration?: number | string;
  thumbnailUrl?: string;
  keywords?: string[];
}

function parseYouTubePost(item: YouTubePost): ParsedPost | null {
  // YouTube uses channel name/handle as the "author"
  const channelHandle = item.channelHandle || extractYouTubeHandle(item.channelUrl);
  const channelName = item.channelName;

  if (!channelHandle && !channelName) return null;

  const postUrl = item.url || `https://www.youtube.com/watch?v=${item.id}`;

  // Parse duration if it's a string (e.g., "PT5M30S")
  let durationSeconds: number | undefined;
  if (typeof item.duration === "number") {
    durationSeconds = item.duration;
  } else if (typeof item.duration === "string") {
    durationSeconds = parseISO8601Duration(item.duration);
  }

  return {
    platform: "youtube",
    postUrl,
    postId: item.id,
    authorHandle: channelHandle || channelName || "",
    authorName: channelName,
    content: item.title,
    engagement: {
      views: item.viewCount,
      likes: item.likes ?? item.likeCount,
      comments: item.commentCount,
    },
    postedAt: item.date
      ? new Date(item.date)
      : item.uploadDate
        ? new Date(item.uploadDate)
        : undefined,
    metadata: {
      hashtags: item.keywords,
      thumbnailUrl: item.thumbnailUrl,
      duration: durationSeconds,
      followerCount: item.numberOfSubscribers ?? item.subscriberCount,
      rawData: {
        description: item.details || item.description,
        channelUrl: item.channelUrl,
      },
    },
  };
}

/**
 * Extract YouTube handle from channel URL
 * e.g., "https://www.youtube.com/@channelhandle" -> "channelhandle"
 */
function extractYouTubeHandle(url?: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/@([^\/\?]+)/);
  return match?.[1];
}

/**
 * Parse ISO 8601 duration to seconds
 * e.g., "PT5M30S" -> 330
 */
function parseISO8601Duration(duration: string): number | undefined {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return undefined;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Facebook post structure from apify/facebook-posts-scraper
 *
 * Key fields:
 * - postId: Post ID
 * - postUrl or url: Direct link to post
 * - pageName: Page/profile name
 * - pageUrl: Page URL
 * - text: Post content
 * - likes or reactions: Like/reaction count
 * - comments: Comment count
 * - shares: Share count
 * - time: Timestamp
 */
interface FacebookPost {
  postId?: string;
  postUrl?: string;
  url?: string;
  pageName?: string;
  pageUrl?: string;
  pageHandle?: string;
  text?: string;
  likes?: number;
  reactions?: number;
  reactionsCount?: number;
  comments?: number;
  commentsCount?: number;
  shares?: number;
  sharesCount?: number;
  time?: string | number;
  timestamp?: string | number;
  date?: string;
  isVerified?: boolean;
  followersCount?: number;
}

function parseFacebookPost(item: FacebookPost): ParsedPost | null {
  const pageName = item.pageName;
  if (!pageName) return null;

  const postUrl = item.postUrl || item.url;
  if (!postUrl) return null;

  // Extract handle from page URL if available
  const handle = item.pageHandle || extractFacebookHandle(item.pageUrl) || pageName;

  // Parse timestamp from various formats
  let postedAt: Date | undefined;
  if (item.time) {
    postedAt = new Date(
      typeof item.time === "number" ? item.time * 1000 : item.time
    );
  } else if (item.timestamp) {
    postedAt = new Date(
      typeof item.timestamp === "number" ? item.timestamp * 1000 : item.timestamp
    );
  } else if (item.date) {
    postedAt = new Date(item.date);
  }

  return {
    platform: "facebook",
    postUrl,
    postId: item.postId,
    authorHandle: handle,
    authorName: pageName,
    content: item.text,
    engagement: {
      likes: item.likes ?? item.reactions ?? item.reactionsCount,
      comments: item.comments ?? item.commentsCount,
      shares: item.shares ?? item.sharesCount,
    },
    postedAt,
    metadata: {
      isVerified: item.isVerified,
      followerCount: item.followersCount,
    },
  };
}

/**
 * Extract Facebook handle from page URL
 * e.g., "https://www.facebook.com/pagename" -> "pagename"
 */
function extractFacebookHandle(url?: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/facebook\.com\/([^\/\?]+)/);
  return match?.[1];
}

/**
 * Fetch dataset items from Apify API
 */
async function fetchDatasetItems(datasetId: string): Promise<unknown[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error("APIFY_API_TOKEN environment variable is not set");
  }

  const url = `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${token}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch dataset ${datasetId}: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Instagram profile data structure from apify/instagram-profile-scraper
 * This is different from hashtag scraper - it returns profile objects with nested posts
 */
interface InstagramProfile {
  username?: string;
  fullName?: string;
  followersCount?: number;
  verified?: boolean;
  latestPosts?: InstagramPost[];
}

/**
 * Flatten profile scraper results into individual posts
 * Profile scraper returns: [{ username, latestPosts: [...] }, ...]
 * We need to extract: [post1, post2, post3, ...]
 */
function flattenProfileScraperItems(items: unknown[]): unknown[] {
  const flattenedPosts: unknown[] = [];

  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;

    const profile = item as InstagramProfile;

    // Check if this is profile scraper output (has latestPosts array)
    if (profile.latestPosts && Array.isArray(profile.latestPosts)) {
      // Extract posts from the profile, adding profile info to each post
      for (const post of profile.latestPosts) {
        flattenedPosts.push({
          ...post,
          // Ensure ownerUsername is set (profile scraper posts should have this)
          ownerUsername: post.ownerUsername || profile.username,
          // Add follower count from profile if not on post
          followersCount: post.followersCount ?? profile.followersCount,
          isVerified: post.isVerified ?? profile.verified,
        });
      }
    } else {
      // This is already a flat post (from hashtag scraper)
      flattenedPosts.push(item);
    }
  }

  return flattenedPosts;
}

/**
 * Parse items based on detected platform
 */
function parseItems(
  items: unknown[],
  platform: Platform
): { posts: ParsedPost[]; errors: string[] } {
  const posts: ParsedPost[] = [];
  const errors: string[] = [];

  // For Instagram, flatten profile scraper results first
  const itemsToProcess = platform === "instagram"
    ? flattenProfileScraperItems(items)
    : items;

  console.log(`[Apify] Processing ${itemsToProcess.length} items for ${platform} (original: ${items.length})`);

  for (const item of itemsToProcess) {
    if (typeof item !== "object" || item === null) {
      errors.push("Invalid item: not an object");
      continue;
    }

    let post: ParsedPost | null = null;

    try {
      switch (platform) {
        case "instagram":
          post = parseInstagramPost(item as InstagramPost);
          break;
        case "tiktok":
          post = parseTikTokPost(item as TikTokPost);
          break;
        case "twitter":
          post = parseTwitterPost(item as TwitterPost);
          break;
        case "youtube":
          post = parseYouTubePost(item as YouTubePost);
          break;
        case "facebook":
          post = parseFacebookPost(item as FacebookPost);
          break;
      }

      if (post) {
        posts.push(post);
      }
    } catch (error) {
      errors.push(
        `Failed to parse ${platform} item: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return { posts, errors };
}

/**
 * Apify Hashtag Monitoring Provider
 */
export const apifyProvider: HashtagMonitoringProvider = {
  name: "apify",

  /**
   * Verify webhook signature
   *
   * Apify webhooks include a secret in the X-Apify-Webhook-Secret header.
   * This should match the APIFY_WEBHOOK_SECRET environment variable.
   */
  verifyWebhook(payload: string, headers: Record<string, string>): boolean {
    const secret = process.env.APIFY_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("APIFY_WEBHOOK_SECRET not configured, skipping verification");
      return true;
    }

    // Check for secret in common header formats
    const providedSecret =
      headers["x-apify-webhook-secret"] ||
      headers["X-Apify-Webhook-Secret"] ||
      headers["x-apify-secret"] ||
      headers["X-Apify-Secret"];

    return providedSecret === secret;
  },

  /**
   * Parse webhook payload and fetch/normalize posts
   *
   * Apify sends a notification when an actor run completes.
   * The payload contains a dataset ID that we use to fetch actual results.
   */
  async parseWebhookPayload(
    payload: unknown,
    headers?: Record<string, string>
  ): Promise<ParseResult> {
    const errors: string[] = [];

    if (typeof payload !== "object" || payload === null) {
      return { posts: [], errors: ["Invalid payload: not an object"] };
    }

    const webhookPayload = payload as ApifyWebhookPayload;

    // Get actor ID for platform detection
    const actorId = webhookPayload.eventData?.actorId;

    // Check if items are included directly (some configurations)
    let items: unknown[] = [];

    if (webhookPayload.items && Array.isArray(webhookPayload.items)) {
      items = webhookPayload.items;
    } else if (webhookPayload.resource?.defaultDatasetId) {
      // Fetch from dataset
      try {
        items = await fetchDatasetItems(webhookPayload.resource.defaultDatasetId);
      } catch (error) {
        return {
          posts: [],
          errors: [
            `Failed to fetch dataset: ${error instanceof Error ? error.message : "Unknown error"}`,
          ],
        };
      }
    } else {
      return {
        posts: [],
        errors: ["No dataset ID or items found in payload"],
      };
    }

    if (items.length === 0) {
      return { posts: [], errors: [] };
    }

    // Detect platform from actor ID or first item
    const sampleItem =
      typeof items[0] === "object" && items[0] !== null
        ? (items[0] as Record<string, unknown>)
        : undefined;

    const platform = detectPlatform(actorId, sampleItem);

    if (!platform) {
      return {
        posts: [],
        errors: [
          `Could not detect platform from actor ID "${actorId}" or payload structure`,
        ],
      };
    }

    // Parse all items
    const result = parseItems(items, platform);
    errors.push(...result.errors);

    return {
      posts: result.posts,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};

// Register the provider on module load
registerProvider(apifyProvider);

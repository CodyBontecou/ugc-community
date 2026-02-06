/**
 * Scrape Creators API Client
 *
 * Direct REST API client for https://scrapecreators.com/
 * Replaces the Apify webhook-based approach with synchronous API calls.
 *
 * Key advantages over Apify:
 * - Real-time responses (no webhook roundtrip)
 * - Per-request pricing (1 credit per call)
 * - Profile peek: check videoCount before fetching all videos
 * - Simpler architecture: no actors, datasets, or webhooks
 */

const API_BASE = "https://api.scrapecreators.com";

function getApiKey(): string {
  const key = process.env.SCRAPE_CREATORS_API_KEY;
  if (!key) {
    throw new Error("SCRAPE_CREATORS_API_KEY environment variable is not set");
  }
  return key;
}

// ─── TikTok Types ─────────────────────────────────────────────

export interface TikTokProfileResponse {
  user: {
    id: string;
    uniqueId: string;
    nickname: string;
    signature: string;
    verified: boolean;
    avatarLarger?: string;
    avatarMedium?: string;
    privateAccount: boolean;
  };
  stats: {
    followerCount: number;
    followingCount: number;
    heart: number;
    heartCount: number;
    videoCount: number;
    diggCount: number;
    friendCount: number;
  };
}

export interface TikTokVideoItem {
  aweme_id: string;
  desc: string;
  create_time: number;
  author: {
    unique_id: string;
    nickname: string;
    follower_count?: number;
    verification_type?: number;
  };
  statistics: {
    digg_count: number;
    comment_count: number;
    play_count: number;
    share_count: number;
    collect_count: number;
    download_count?: number;
  };
  video: {
    duration: number;
    cover?: {
      url_list?: string[];
    };
  };
  share_url?: string;
  cha_list?: Array<{ cha_name: string }>;
  text_extra?: Array<{ hashtag_name?: string }>;
  // Convenience fields added by Scrape Creators
  create_time_utc?: string;
  url?: string;
  is_ad?: boolean;
}

export interface TikTokProfileVideosResponse {
  aweme_list: TikTokVideoItem[];
  has_more: number;
  max_cursor: number;
  min_cursor: number;
  status_code: number;
}

// ─── Instagram Types ──────────────────────────────────────────

/**
 * Response from GET /v1/instagram/profile
 * Wrapped in { data: { user: ... } }
 */
export interface InstagramProfileApiResponse {
  success?: boolean;
  credits_remaining?: number;
  data: {
    user: {
      username: string;
      full_name: string;
      biography: string;
      edge_followed_by: { count: number };
      edge_follow: { count: number };
      edge_owner_to_timeline_media: { count: number };
      is_verified: boolean;
      is_private: boolean;
      id: string;
      profile_pic_url?: string;
    };
  };
}

/** Normalized profile data extracted from the API response */
export interface InstagramProfileData {
  username: string;
  full_name: string;
  follower_count: number;
  following_count: number;
  media_count: number;
  is_verified: boolean;
  is_private: boolean;
  user_id: string;
}

/**
 * Instagram post item from GET /v2/instagram/user/posts
 * Uses Instagram's internal API format (not Graph API)
 */
export interface InstagramPostItem {
  id: string;
  code: string; // shortcode for URL construction
  caption?: {
    text: string;
  };
  like_count?: number;
  comment_count?: number;
  play_count?: number;
  taken_at?: number; // Unix timestamp in seconds
  media_type?: number; // 1=photo, 2=video, 8=carousel
  image_versions2?: {
    candidates?: Array<{ url: string; width: number; height: number }>;
  };
  user?: {
    username: string;
    full_name?: string;
  };
  owner?: {
    username: string;
    full_name?: string;
  };
}

export interface InstagramPostsResponse {
  items: InstagramPostItem[];
  next_cursor?: string;
  has_next_page: boolean;
}

// ─── YouTube Types ────────────────────────────────────────────

export interface YouTubeChannelResponse {
  channelId: string;
  handle: string;
  name: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  description: string;
  avatar: string;
}

export interface YouTubeShortItem {
  type: string;
  id: string;
  url: string;
  title: string;
  viewCountInt: number;
  viewCountText: string;
  commentCountInt: number;
  likeCountInt: number;
  publishDate: string;
  description: string | null;
  genre: string;
}

export interface YouTubeChannelShortsResponse {
  shorts: YouTubeShortItem[];
  continuationToken?: string;
}

// ─── API Functions ────────────────────────────────────────────

/**
 * Get TikTok profile info (1 credit)
 * Use to check videoCount before fetching all videos
 */
export async function getTikTokProfile(
  handle: string
): Promise<TikTokProfileResponse> {
  const apiKey = getApiKey();
  const url = `${API_BASE}/v1/tiktok/profile?handle=${encodeURIComponent(handle)}`;

  const response = await fetch(url, {
    headers: { "x-api-key": apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Scrape Creators TikTok profile error (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

/**
 * Get TikTok profile videos (credits vary)
 * Returns paginated list of videos with full metadata
 */
export async function getTikTokProfileVideos(
  handle: string,
  cursor?: number
): Promise<TikTokProfileVideosResponse> {
  const apiKey = getApiKey();
  let url = `${API_BASE}/v3/tiktok/profile/videos?handle=${encodeURIComponent(handle)}`;
  if (cursor) {
    url += `&cursor=${cursor}`;
  }

  const response = await fetch(url, {
    headers: { "x-api-key": apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Scrape Creators TikTok videos error (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

/**
 * Get Instagram profile info (1 credit)
 * Uses /v1/instagram/profile which accepts a handle.
 * Returns normalized profile data including media_count for peek optimization.
 */
export async function getInstagramProfile(
  handle: string
): Promise<InstagramProfileData> {
  const apiKey = getApiKey();
  const url = `${API_BASE}/v1/instagram/profile?handle=${encodeURIComponent(handle)}`;

  const response = await fetch(url, {
    headers: { "x-api-key": apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Scrape Creators Instagram profile error (${response.status}): ${errorText}`
    );
  }

  const raw: InstagramProfileApiResponse = await response.json();
  const user = raw.data?.user;

  if (!user) {
    throw new Error(`Instagram profile not found for handle: ${handle}`);
  }

  return {
    username: user.username,
    full_name: user.full_name,
    follower_count: user.edge_followed_by?.count ?? 0,
    following_count: user.edge_follow?.count ?? 0,
    media_count: user.edge_owner_to_timeline_media?.count ?? 0,
    is_verified: user.is_verified,
    is_private: user.is_private,
    user_id: user.id,
  };
}

/**
 * Get Instagram user posts (credits vary)
 * Returns paginated list of posts
 */
export async function getInstagramPosts(
  handle: string,
  cursor?: string
): Promise<InstagramPostsResponse> {
  const apiKey = getApiKey();
  let url = `${API_BASE}/v2/instagram/user/posts?handle=${encodeURIComponent(handle)}`;
  if (cursor) {
    url += `&cursor=${encodeURIComponent(cursor)}`;
  }

  const response = await fetch(url, {
    headers: { "x-api-key": apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Scrape Creators Instagram posts error (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

/**
 * Get YouTube channel info (1 credit)
 * Use to check videoCount before fetching shorts
 */
export async function getYouTubeChannel(
  handle: string
): Promise<YouTubeChannelResponse> {
  const apiKey = getApiKey();
  // Strip @ prefix if present
  const cleanHandle = handle.replace(/^@/, "");
  const url = `${API_BASE}/v1/youtube/channel?handle=${encodeURIComponent(cleanHandle)}`;

  const response = await fetch(url, {
    headers: { "x-api-key": apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Scrape Creators YouTube channel error (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

/**
 * Get YouTube channel shorts (credits vary)
 * Returns paginated list of shorts sorted by newest first
 */
export async function getYouTubeChannelShorts(
  handle: string,
  continuationToken?: string
): Promise<YouTubeChannelShortsResponse> {
  const apiKey = getApiKey();
  // Strip @ prefix if present
  const cleanHandle = handle.replace(/^@/, "");
  let url = `${API_BASE}/v1/youtube/channel/shorts?handle=${encodeURIComponent(cleanHandle)}&sort=newest`;
  if (continuationToken) {
    url += `&continuationToken=${encodeURIComponent(continuationToken)}`;
  }

  const response = await fetch(url, {
    headers: { "x-api-key": apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Scrape Creators YouTube shorts error (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

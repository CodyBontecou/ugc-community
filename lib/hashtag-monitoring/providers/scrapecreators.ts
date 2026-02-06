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

export interface InstagramBasicProfileResponse {
  username: string;
  full_name: string;
  biography: string;
  follower_count: number;
  following_count: number;
  media_count: number;
  is_verified: boolean;
  is_private: boolean;
  profile_pic_url?: string;
}

export interface InstagramPostItem {
  id: string;
  shortcode: string;
  display_url: string;
  is_video: boolean;
  caption?: {
    text: string;
  };
  edge_media_to_caption?: {
    edges: Array<{ node: { text: string } }>;
  };
  edge_media_to_comment?: {
    count: number;
  };
  edge_liked_by?: {
    count: number;
  };
  edge_media_preview_like?: {
    count: number;
  };
  video_view_count?: number;
  taken_at_timestamp?: number;
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
 * Get Instagram basic profile info (1 credit)
 * Use to check media_count before fetching all posts
 */
export async function getInstagramBasicProfile(
  handle: string
): Promise<InstagramBasicProfileResponse> {
  const apiKey = getApiKey();
  const url = `${API_BASE}/v1/instagram/basic-profile?handle=${encodeURIComponent(handle)}`;

  const response = await fetch(url, {
    headers: { "x-api-key": apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Scrape Creators Instagram profile error (${response.status}): ${errorText}`
    );
  }

  return response.json();
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

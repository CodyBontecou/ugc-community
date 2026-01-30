/**
 * Hashtag Monitoring Provider Types
 *
 * Provider-agnostic interfaces for hashtag monitoring services.
 * Each provider (Apify, Brand24, etc.) implements these interfaces
 * to normalize data from their specific webhook formats.
 */

export type Platform = "instagram" | "tiktok" | "youtube" | "twitter" | "facebook";

/**
 * Normalized post data from any monitoring provider
 */
export interface ParsedPost {
  platform: Platform;
  postUrl: string;
  postId?: string;
  authorHandle: string;
  authorName?: string;
  content?: string;
  engagement?: {
    likes?: number;
    views?: number;
    comments?: number;
    shares?: number;
    saves?: number;
  };
  postedAt?: Date;
  metadata?: {
    hashtags?: string[];
    thumbnailUrl?: string;
    videoUrl?: string;
    duration?: number;
    isVerified?: boolean;
    followerCount?: number;
    rawData?: Record<string, unknown>;
  };
}

/**
 * Result from parsing a webhook payload
 */
export interface ParseResult {
  posts: ParsedPost[];
  /** Errors encountered during parsing (non-fatal) */
  errors?: string[];
}

/**
 * Interface that all hashtag monitoring providers must implement
 */
export interface HashtagMonitoringProvider {
  /** Unique identifier for this provider */
  name: string;

  /**
   * Parse incoming webhook payload into normalized posts
   * @param payload - Raw webhook body (already JSON parsed)
   * @param headers - Request headers for validation
   */
  parseWebhookPayload(
    payload: unknown,
    headers?: Record<string, string>
  ): Promise<ParseResult>;

  /**
   * Optional: Verify webhook signature/authenticity
   * @param payload - Raw request body as string
   * @param headers - Request headers
   * @returns true if valid, false if invalid
   */
  verifyWebhook?(payload: string, headers: Record<string, string>): boolean;

  /**
   * Optional: Fetch recent posts directly from the provider API
   * Useful for backfilling or manual syncs
   */
  fetchRecentPosts?(hashtag: string, platform: Platform): Promise<ParseResult>;
}

/**
 * Webhook processing result
 */
export interface ProcessingResult {
  success: boolean;
  /** Number of posts successfully saved */
  savedCount: number;
  /** Number of posts that were duplicates (already in DB) */
  duplicateCount: number;
  /** Number of posts matched to users */
  matchedCount: number;
  /** Errors encountered */
  errors: string[];
}

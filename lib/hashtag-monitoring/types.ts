/**
 * Hashtag Monitoring Types
 *
 * Types for the profile monitoring system that uses
 * Scrape Creators API to detect @ugc.community mentions.
 */

export type Platform = "instagram" | "tiktok" | "youtube" | "twitter" | "facebook";

/**
 * Normalized post data from any platform
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
 * Post processing result
 */
export interface ProcessingResult {
  success: boolean;
  savedCount: number;
  duplicateCount: number;
  matchedCount: number;
  errors: string[];
}

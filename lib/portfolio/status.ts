/**
 * Portfolio Status Utilities
 *
 * Determines portfolio active status based on posting requirements
 * and milestone rewards.
 */

import { db } from "@/lib/db";
import { users, hashtagMentions } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export type PortfolioStatus = {
  isActive: boolean;
  reason: "hosting_reward" | "posting_requirement_met" | "requirement_not_met";
  hasHostingReward: boolean;
  hostingRewardExpiry: Date | null;
  monthlyPostCount: number;
  requiredPostCount: number;
};

const MONTHLY_POST_REQUIREMENT = 5;

/**
 * Check if a user's portfolio should be active based on:
 * 1. Hosting reward (hostingUnlockedUntil) - bypasses posting requirement
 * 2. Monthly posting requirement
 */
export async function getPortfolioStatus(
  userId: string
): Promise<PortfolioStatus> {
  // Get user's hosting reward status
  const [user] = await db
    .select({ hostingUnlockedUntil: users.hostingUnlockedUntil })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const now = new Date();
  const hasHostingReward =
    user?.hostingUnlockedUntil !== null &&
    user?.hostingUnlockedUntil !== undefined &&
    user.hostingUnlockedUntil > now;

  // User has free hosting reward - skip posting requirement check
  if (hasHostingReward) {
    return {
      isActive: true,
      reason: "hosting_reward",
      hasHostingReward: true,
      hostingRewardExpiry: user.hostingUnlockedUntil,
      monthlyPostCount: 0, // Not needed when hosting reward is active
      requiredPostCount: MONTHLY_POST_REQUIREMENT,
    };
  }

  // Check monthly posting requirement
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(hashtagMentions)
    .where(
      and(
        eq(hashtagMentions.matchedUserId, userId),
        gte(hashtagMentions.postedAt, startOfMonth)
      )
    );

  const monthlyPostCount = Number(countResult?.count ?? 0);
  const isActive = monthlyPostCount >= MONTHLY_POST_REQUIREMENT;

  return {
    isActive,
    reason: isActive ? "posting_requirement_met" : "requirement_not_met",
    hasHostingReward: false,
    hostingRewardExpiry: null,
    monthlyPostCount,
    requiredPostCount: MONTHLY_POST_REQUIREMENT,
  };
}

/**
 * Quick check if portfolio should be active
 */
export async function isPortfolioActive(userId: string): Promise<boolean> {
  const status = await getPortfolioStatus(userId);
  return status.isActive;
}

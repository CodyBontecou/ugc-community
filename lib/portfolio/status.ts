/**
 * Portfolio Status Utilities
 *
 * Determines portfolio active status based on hosting rewards.
 * The hashtag monitoring system has been removed - portfolios
 * are now active by default unless hosting is explicitly disabled.
 */

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type PortfolioStatus = {
  isActive: boolean;
  reason: "hosting_reward" | "default_active";
  hasHostingReward: boolean;
  hostingRewardExpiry: Date | null;
};

/**
 * Check if a user's portfolio should be active.
 * With hashtag monitoring removed, portfolios are active by default
 * or based on hosting reward status.
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

  // User has free hosting reward
  if (hasHostingReward) {
    return {
      isActive: true,
      reason: "hosting_reward",
      hasHostingReward: true,
      hostingRewardExpiry: user.hostingUnlockedUntil,
    };
  }

  // Default: portfolios are active
  return {
    isActive: true,
    reason: "default_active",
    hasHostingReward: false,
    hostingRewardExpiry: null,
  };
}

/**
 * Quick check if portfolio should be active
 */
export async function isPortfolioActive(userId: string): Promise<boolean> {
  const status = await getPortfolioStatus(userId);
  return status.isActive;
}

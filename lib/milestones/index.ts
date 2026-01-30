/**
 * Milestone Checking Service
 *
 * Handles checking and awarding milestones to users based on their post counts.
 */

import type { Milestone } from "@/lib/db/schema";
import {
  getAllMilestones,
  hasUserEarnedMilestone,
  awardMilestone,
  getMonthlyPostCount,
  getLifetimePostCountFromMentions,
  updateUserLifetimePostCount,
} from "./queries";

export type AwardedMilestone = {
  milestone: Milestone;
  monthYear?: string;
};

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonthYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get days remaining in current month
 */
export function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

/**
 * Check and award milestones to a user
 *
 * @param userId - The user ID to check milestones for
 * @returns Array of newly awarded milestones
 */
export async function checkAndAwardMilestones(
  userId: string
): Promise<AwardedMilestone[]> {
  const awardedMilestones: AwardedMilestone[] = [];

  // Get all milestone definitions
  const allMilestones = await getAllMilestones();

  // Get current month info
  const now = new Date();
  const currentMonthYear = getCurrentMonthYear();

  // Get user's post counts
  const monthlyPostCount = await getMonthlyPostCount(
    userId,
    now.getFullYear(),
    now.getMonth() + 1
  );
  const lifetimePostCount = await getLifetimePostCountFromMentions(userId);

  // Check each milestone
  for (const milestone of allMilestones) {
    const isMonthly = milestone.type === "monthly";
    const monthYear = isMonthly ? currentMonthYear : undefined;
    const relevantCount = isMonthly ? monthlyPostCount : lifetimePostCount;

    // Check if threshold is met
    if (relevantCount < milestone.threshold) {
      continue;
    }

    // Check if already earned
    const alreadyEarned = await hasUserEarnedMilestone(
      userId,
      milestone.id,
      monthYear
    );

    if (alreadyEarned) {
      continue;
    }

    // Award the milestone
    await awardMilestone(userId, milestone.id, monthYear);
    awardedMilestones.push({ milestone, monthYear });
  }

  return awardedMilestones;
}

/**
 * Update a user's lifetime post count and check for new milestones
 *
 * @param userId - The user ID to update
 * @returns Object with updated count and newly awarded milestones
 */
export async function updateUserPostCount(userId: string): Promise<{
  lifetimePostCount: number;
  awardedMilestones: AwardedMilestone[];
}> {
  // Count total matched posts for user
  const lifetimePostCount = await getLifetimePostCountFromMentions(userId);

  // Update the user's lifetime post count
  await updateUserLifetimePostCount(userId, lifetimePostCount);

  // Check and award any new milestones
  const awardedMilestones = await checkAndAwardMilestones(userId);

  return {
    lifetimePostCount,
    awardedMilestones,
  };
}

export * from "./queries";

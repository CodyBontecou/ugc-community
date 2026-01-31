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
import { applyMilestoneReward } from "./rewards";

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
 * Get the anniversary date for a given month.
 * If the signup day doesn't exist in the target month, uses the last day of that month.
 * (e.g., signup on Jan 31 → Feb anniversary is Feb 28)
 */
function getAnniversaryDateInMonth(
  signupDay: number,
  year: number,
  month: number
): Date {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const anniversaryDay = Math.min(signupDay, lastDayOfMonth);
  return new Date(year, month, anniversaryDay);
}

/**
 * Get the start of the user's current anniversary period.
 * Period starts on the monthly anniversary of their signup date.
 *
 * @param userCreatedAt - The user's account creation date
 * @returns Start date of current period
 */
export function getUserPeriodStart(userCreatedAt: Date): Date {
  const now = new Date();
  const signupDay = userCreatedAt.getDate();

  // Get anniversary date in current month
  const currentMonthAnniversary = getAnniversaryDateInMonth(
    signupDay,
    now.getFullYear(),
    now.getMonth()
  );

  // Compare at start of day to avoid time issues
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  // If today >= anniversary date, period started this month
  if (todayStart >= currentMonthAnniversary) {
    return currentMonthAnniversary;
  }

  // Otherwise period started last month
  let year = now.getFullYear();
  let month = now.getMonth() - 1;
  if (month < 0) {
    month = 11;
    year -= 1;
  }

  return getAnniversaryDateInMonth(signupDay, year, month);
}

/**
 * Get the end of the user's current anniversary period.
 * Period ends the day before the next anniversary date.
 *
 * @param userCreatedAt - The user's account creation date
 * @returns End date of current period
 */
export function getUserPeriodEnd(userCreatedAt: Date): Date {
  const now = new Date();
  const signupDay = userCreatedAt.getDate();

  // Get anniversary date in current month
  const currentMonthAnniversary = getAnniversaryDateInMonth(
    signupDay,
    now.getFullYear(),
    now.getMonth()
  );

  // Compare at start of day
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  let nextAnniversary: Date;

  // If today >= anniversary, next anniversary is next month
  if (todayStart >= currentMonthAnniversary) {
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    nextAnniversary = getAnniversaryDateInMonth(signupDay, year, month);
  } else {
    // Next anniversary is this month
    nextAnniversary = currentMonthAnniversary;
  }

  // Period end is day before next anniversary
  const periodEnd = new Date(nextAnniversary);
  periodEnd.setDate(periodEnd.getDate() - 1);
  return periodEnd;
}

/**
 * Get the number of days remaining in the user's current anniversary period.
 *
 * @param userCreatedAt - The user's account creation date
 * @returns Number of days remaining (0 if today is the last day)
 */
export function getDaysRemainingInPeriod(userCreatedAt: Date): number {
  const periodEnd = getUserPeriodEnd(userCreatedAt);
  const now = new Date();

  // Compare at start of day
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const endStart = new Date(
    periodEnd.getFullYear(),
    periodEnd.getMonth(),
    periodEnd.getDate()
  );

  const diffTime = endStart.getTime() - todayStart.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Get a unique identifier for the user's current anniversary period.
 * Format: 'YYYY-MM-DD:YYYY-MM-DD' (start:end)
 *
 * @param userCreatedAt - The user's account creation date
 * @returns Period identifier string
 */
export function getUserPeriodIdentifier(userCreatedAt: Date): string {
  const start = getUserPeriodStart(userCreatedAt);
  const end = getUserPeriodEnd(userCreatedAt);

  const formatDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return `${formatDate(start)}:${formatDate(end)}`;
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

    // Apply the milestone's reward
    await applyMilestoneReward(userId, milestone);

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
export * from "./rewards";

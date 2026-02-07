/**
 * Milestone Reward Application Service
 *
 * Handles applying rewards when users earn milestones.
 */

import { db } from "@/lib/db";
import { users, milestones, userMilestones } from "@/lib/db/schema";
import type { Milestone, MilestoneRewardConfig, User } from "@/lib/db/schema";
import { eq, and, or, gte, sql } from "drizzle-orm";
import { getUserEarnedMilestones } from "./queries";

export type RewardType =
  | "hosting"
  | "analytics"
  | "edits"
  | "directory_boost"
  | "badge"
  | "custom_domain";

export type ActiveReward = {
  type: RewardType;
  name: string;
  description: string;
  earnedAt: Date;
  expiresAt: Date | null;
  isPermanent: boolean;
  milestoneName: string;
};

/**
 * Apply a milestone's reward to a user
 */
export async function applyMilestoneReward(
  userId: string,
  milestone: Milestone
): Promise<void> {
  const rewardType = milestone.rewardType as RewardType;
  const config = milestone.rewardConfig as MilestoneRewardConfig;

  switch (rewardType) {
    case "directory_boost":
      await applyDirectoryBoost(userId, config);
      break;

    case "analytics":
      await applyAnalyticsAccess(userId);
      break;

    case "hosting":
      await applyHostingReward(userId, config);
      break;

    case "badge":
      await applyBadgeReward(userId, config);
      break;

    case "edits":
      await applyEditsReward(userId, config);
      break;

    case "custom_domain":
      // This reward type can be expanded later
      break;
  }
}

/**
 * Apply directory boost reward
 */
async function applyDirectoryBoost(
  userId: string,
  config: MilestoneRewardConfig
): Promise<void> {
  const isPermanent = config.permanent || config.duration_days === undefined;

  if (isPermanent) {
    // Permanent boost - set isFeatured to true
    await db
      .update(users)
      .set({ isFeatured: true })
      .where(eq(users.id, userId));
  } else {
    // Time-limited boost
    const durationDays = config.duration_days ?? 30;
    const boostUntil = new Date();
    boostUntil.setDate(boostUntil.getDate() + durationDays);

    // Get current boost expiration
    const [user] = await db
      .select({ directoryBoostUntil: users.directoryBoostUntil })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Extend if already boosted, otherwise set new expiration
    let newExpiration = boostUntil;
    if (user?.directoryBoostUntil && user.directoryBoostUntil > new Date()) {
      newExpiration = new Date(user.directoryBoostUntil);
      newExpiration.setDate(newExpiration.getDate() + durationDays);
    }

    await db
      .update(users)
      .set({ directoryBoostUntil: newExpiration })
      .where(eq(users.id, userId));
  }
}

/**
 * Apply analytics access reward
 */
async function applyAnalyticsAccess(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ hasAdvancedAnalytics: true })
    .where(eq(users.id, userId));
}

/**
 * Apply badge reward
 * Special handling for verified badge - sets isVerified on user
 * Also removes any lower-tier badges that are replaced by this one
 */
async function applyBadgeReward(
  userId: string,
  config: MilestoneRewardConfig
): Promise<void> {
  const badgeType = config.badge_type;

  if (badgeType === "verified") {
    await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.id, userId));

    // Remove any badges that are superseded by the verified badge
    await removeSupersededBadges(userId, "verified");
  }
  // Other badge types are displayed from userMilestones table, no additional processing needed
}

/**
 * Remove badges that are superseded by a higher-tier badge.
 * Looks for milestones with rewardConfig.replaced_by_badge matching the new badge type,
 * and deletes the corresponding userMilestone records.
 */
async function removeSupersededBadges(
  userId: string,
  newBadgeType: string
): Promise<void> {
  // Find all badge milestones that should be replaced by this badge type
  const supersededMilestones = await db
    .select({ id: milestones.id, name: milestones.name })
    .from(milestones)
    .where(
      and(
        eq(milestones.rewardType, "badge"),
        sql`${milestones.rewardConfig}->>'replaced_by_badge' = ${newBadgeType}`
      )
    );

  if (supersededMilestones.length === 0) return;

  // Delete the user's earned records for these superseded milestones
  for (const milestone of supersededMilestones) {
    await db
      .delete(userMilestones)
      .where(
        and(
          eq(userMilestones.userId, userId),
          eq(userMilestones.milestoneId, milestone.id)
        )
      );
    console.log(
      `[Milestones] Removed superseded badge "${milestone.name}" for user ${userId} (replaced by ${newBadgeType})`
    );
  }
}

/**
 * Apply edits reward
 * Grants profile edit allowance or unlimited edits
 */
async function applyEditsReward(
  userId: string,
  config: MilestoneRewardConfig
): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7); // '2026-01' format

  if (config.unlimited) {
    // Unlimited edits until end of month
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0); // Last day of current month
    endOfMonth.setHours(23, 59, 59, 999);

    await db
      .update(users)
      .set({ unlimitedEditsUntil: endOfMonth })
      .where(eq(users.id, userId));
  } else if (config.edits_granted) {
    // Grant specific number of edits
    const [user] = await db
      .select({
        editsResetMonth: users.editsResetMonth,
        monthlyEditsAllowance: users.monthlyEditsAllowance,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Reset if different month, otherwise add to allowance
    const isNewMonth = user?.editsResetMonth !== currentMonth;
    const newAllowance = isNewMonth
      ? config.edits_granted
      : (user?.monthlyEditsAllowance ?? 0) + config.edits_granted;

    await db
      .update(users)
      .set({
        monthlyEditsAllowance: newAllowance,
        editsResetMonth: currentMonth,
        monthlyEditsUsed: isNewMonth ? 0 : sql`${users.monthlyEditsUsed}`,
      })
      .where(eq(users.id, userId));
  }

  // Apply companion directory boost if configured
  if (config.companion_boost_days) {
    await applyDirectoryBoost(userId, { duration_days: config.companion_boost_days });
  }
}

/**
 * Apply hosting reward
 */
async function applyHostingReward(
  userId: string,
  config: MilestoneRewardConfig
): Promise<void> {
  const isPermanent = config.permanent || config.duration_days === undefined;

  if (isPermanent) {
    // Set far future date for permanent hosting
    const farFuture = new Date("2099-12-31");
    await db
      .update(users)
      .set({ hostingUnlockedUntil: farFuture })
      .where(eq(users.id, userId));
  } else {
    const durationDays = config.duration_days ?? 365;
    const hostingUntil = new Date();
    hostingUntil.setDate(hostingUntil.getDate() + durationDays);

    // Get current hosting expiration
    const [user] = await db
      .select({ hostingUnlockedUntil: users.hostingUnlockedUntil })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Extend if already unlocked, otherwise set new expiration
    let newExpiration = hostingUntil;
    if (user?.hostingUnlockedUntil && user.hostingUnlockedUntil > new Date()) {
      newExpiration = new Date(user.hostingUnlockedUntil);
      newExpiration.setDate(newExpiration.getDate() + durationDays);
    }

    await db
      .update(users)
      .set({ hostingUnlockedUntil: newExpiration })
      .where(eq(users.id, userId));
  }
}

/**
 * Check if a user has a specific reward type active
 *
 * @param badgeType - For badge rewards, optionally specify which badge type (e.g., "verified")
 */
export async function checkUserHasReward(
  userId: string,
  rewardType: RewardType,
  badgeType?: string
): Promise<boolean> {
  const [user] = await db
    .select({
      isFeatured: users.isFeatured,
      isVerified: users.isVerified,
      hasAdvancedAnalytics: users.hasAdvancedAnalytics,
      hostingUnlockedUntil: users.hostingUnlockedUntil,
      directoryBoostUntil: users.directoryBoostUntil,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return false;

  const now = new Date();

  switch (rewardType) {
    case "directory_boost":
      return (
        user.isFeatured ||
        (user.directoryBoostUntil !== null && user.directoryBoostUntil > now)
      );

    case "analytics":
      return user.hasAdvancedAnalytics;

    case "hosting":
      return (
        user.hostingUnlockedUntil !== null && user.hostingUnlockedUntil > now
      );

    case "badge":
      // Check specific badge type if provided
      if (badgeType === "verified") {
        return user.isVerified;
      }
      // Other badges are always available once earned via userMilestones
      return true;

    default:
      return false;
  }
}

/**
 * Get all active rewards for a user
 */
export async function getUserActiveRewards(
  userId: string
): Promise<ActiveReward[]> {
  const activeRewards: ActiveReward[] = [];
  const now = new Date();

  // Get user's reward fields
  const [user] = await db
    .select({
      isFeatured: users.isFeatured,
      hasAdvancedAnalytics: users.hasAdvancedAnalytics,
      hostingUnlockedUntil: users.hostingUnlockedUntil,
      directoryBoostUntil: users.directoryBoostUntil,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return activeRewards;

  // Get earned milestones to match rewards to their source
  const earnedMilestones = await getUserEarnedMilestones(userId);

  // Helper to find the milestone that granted a reward
  const findMilestoneForReward = (rewardType: RewardType) => {
    return earnedMilestones.find((e) => e.milestone.rewardType === rewardType);
  };

  // Check directory boost
  if (user.isFeatured) {
    const source = findMilestoneForReward("directory_boost");
    activeRewards.push({
      type: "directory_boost",
      name: "Featured Creator",
      description: "Boosted visibility in the creator directory",
      earnedAt: source?.earnedAt ?? new Date(),
      expiresAt: null,
      isPermanent: true,
      milestoneName: source?.milestone.name ?? "Achievement",
    });
  } else if (user.directoryBoostUntil && user.directoryBoostUntil > now) {
    const source = findMilestoneForReward("directory_boost");
    activeRewards.push({
      type: "directory_boost",
      name: "Directory Boost",
      description: "Boosted visibility in the creator directory",
      earnedAt: source?.earnedAt ?? new Date(),
      expiresAt: user.directoryBoostUntil,
      isPermanent: false,
      milestoneName: source?.milestone.name ?? "Achievement",
    });
  }

  // Check analytics access
  if (user.hasAdvancedAnalytics) {
    const source = findMilestoneForReward("analytics");
    activeRewards.push({
      type: "analytics",
      name: "Advanced Analytics",
      description:
        "Access to detailed engagement metrics, comparison charts, and export",
      earnedAt: source?.earnedAt ?? new Date(),
      expiresAt: null,
      isPermanent: true,
      milestoneName: source?.milestone.name ?? "Achievement",
    });
  }

  // Check hosting
  if (user.hostingUnlockedUntil && user.hostingUnlockedUntil > now) {
    const source = findMilestoneForReward("hosting");
    const isPermanent =
      user.hostingUnlockedUntil.getFullYear() >= 2099;
    activeRewards.push({
      type: "hosting",
      name: "Free Hosting",
      description: "Portfolio hosting without posting requirements",
      earnedAt: source?.earnedAt ?? new Date(),
      expiresAt: isPermanent ? null : user.hostingUnlockedUntil,
      isPermanent,
      milestoneName: source?.milestone.name ?? "Achievement",
    });
  }

  // Add badges from earned milestones
  for (const earned of earnedMilestones) {
    if (earned.milestone.rewardType === "badge") {
      const config = earned.milestone.rewardConfig as MilestoneRewardConfig;
      const isTemporary = !!config.replaced_by_badge;
      activeRewards.push({
        type: "badge",
        name: earned.milestone.name,
        description: earned.milestone.description ?? "Achievement badge",
        earnedAt: earned.earnedAt,
        expiresAt: null,
        isPermanent: !isTemporary,
        milestoneName: earned.milestone.name,
      });
    }
  }

  return activeRewards;
}

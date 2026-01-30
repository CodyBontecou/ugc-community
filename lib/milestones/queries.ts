/**
 * Milestone System Database Queries
 *
 * Low-level database operations for the milestone system.
 */

import { db } from "@/lib/db";
import { milestones, userMilestones, users, hashtagMentions } from "@/lib/db/schema";
import { eq, and, sql, gte, lt } from "drizzle-orm";

/**
 * Get all milestone definitions
 */
export async function getAllMilestones() {
  return db.query.milestones.findMany({
    orderBy: (milestones, { asc }) => [asc(milestones.displayOrder), asc(milestones.threshold)],
  });
}

/**
 * Get user's earned milestones
 */
export async function getUserEarnedMilestones(userId: string) {
  return db.query.userMilestones.findMany({
    where: eq(userMilestones.userId, userId),
    with: {
      milestone: true,
    },
  });
}

/**
 * Get user's earned milestones for a specific month (for monthly milestones)
 */
export async function getUserMonthlyMilestones(userId: string, monthYear: string) {
  return db.query.userMilestones.findMany({
    where: and(
      eq(userMilestones.userId, userId),
      eq(userMilestones.monthYear, monthYear)
    ),
    with: {
      milestone: true,
    },
  });
}

/**
 * Get user's lifetime milestones (no monthYear)
 */
export async function getUserLifetimeMilestones(userId: string) {
  return db.query.userMilestones.findMany({
    where: and(
      eq(userMilestones.userId, userId),
      sql`${userMilestones.monthYear} IS NULL`
    ),
    with: {
      milestone: true,
    },
  });
}

/**
 * Award a milestone to a user
 */
export async function awardMilestone(
  userId: string,
  milestoneId: string,
  monthYear?: string
) {
  return db
    .insert(userMilestones)
    .values({
      userId,
      milestoneId,
      monthYear: monthYear ?? null,
      earnedAt: new Date(),
    })
    .returning();
}

/**
 * Check if user has already earned a specific milestone
 */
export async function hasUserEarnedMilestone(
  userId: string,
  milestoneId: string,
  monthYear?: string
): Promise<boolean> {
  const condition = monthYear
    ? and(
        eq(userMilestones.userId, userId),
        eq(userMilestones.milestoneId, milestoneId),
        eq(userMilestones.monthYear, monthYear)
      )
    : and(
        eq(userMilestones.userId, userId),
        eq(userMilestones.milestoneId, milestoneId),
        sql`${userMilestones.monthYear} IS NULL`
      );

  const result = await db.query.userMilestones.findFirst({
    where: condition,
  });

  return !!result;
}

/**
 * Get user's monthly post count from hashtagMentions
 */
export async function getMonthlyPostCount(
  userId: string,
  year: number,
  month: number
): Promise<number> {
  const startOfMonth = new Date(year, month - 1, 1);
  const startOfNextMonth = new Date(year, month, 1);

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(hashtagMentions)
    .where(
      and(
        eq(hashtagMentions.matchedUserId, userId),
        gte(hashtagMentions.postedAt, startOfMonth),
        lt(hashtagMentions.postedAt, startOfNextMonth)
      )
    );

  return Number(result?.count ?? 0);
}

/**
 * Get user's lifetime post count from hashtagMentions
 */
export async function getLifetimePostCountFromMentions(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(hashtagMentions)
    .where(eq(hashtagMentions.matchedUserId, userId));

  return Number(result?.count ?? 0);
}

/**
 * Get user's lifetime post count from users table
 */
export async function getUserLifetimePostCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ lifetimePostCount: users.lifetimePostCount })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result?.lifetimePostCount ?? 0;
}

/**
 * Update user's lifetime post count
 */
export async function updateUserLifetimePostCount(
  userId: string,
  count: number
): Promise<void> {
  await db
    .update(users)
    .set({ lifetimePostCount: count })
    .where(eq(users.id, userId));
}

/**
 * Get user's earned badge milestones (for profile display)
 * Returns only lifetime milestones with rewardType = 'badge'
 */
export async function getUserBadgeMilestones(userId: string) {
  const earned = await db.query.userMilestones.findMany({
    where: and(
      eq(userMilestones.userId, userId),
      sql`${userMilestones.monthYear} IS NULL` // Only lifetime badges
    ),
    with: {
      milestone: true,
    },
  });

  // Filter to only include badge rewards
  return earned.filter((e) => e.milestone.rewardType === "badge");
}

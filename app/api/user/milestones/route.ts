import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import {
  getAllMilestones,
  getUserMonthlyMilestones,
  getUserLifetimeMilestones,
  getMonthlyPostCount,
  getUserLifetimePostCount,
  getCurrentMonthYear,
  getDaysRemainingInMonth,
} from "@/lib/milestones";
import type { Milestone, UserMilestone } from "@/lib/db/schema";

type MilestoneWithEarned = {
  id: string;
  threshold: number;
  name: string;
  description: string | null;
  rewardType: string;
  earned: boolean;
  earnedAt: string | null;
};

type NextMilestone = {
  threshold: number;
  postsNeeded: number;
} | null;

type MilestoneProgressResponse = {
  monthly: {
    postCount: number;
    currentMonth: string;
    daysRemaining: number;
    milestones: MilestoneWithEarned[];
    nextMilestone: NextMilestone;
  };
  lifetime: {
    postCount: number;
    milestones: MilestoneWithEarned[];
    nextMilestone: NextMilestone;
  };
};

/**
 * GET /api/user/milestones - Get current user's milestone progress
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Get all milestone definitions
    const allMilestones = await getAllMilestones();

    // Separate by type
    const monthlyMilestones = allMilestones.filter((m) => m.type === "monthly");
    const lifetimeMilestones = allMilestones.filter((m) => m.type === "lifetime");

    // Get current month info
    const now = new Date();
    const currentMonthYear = getCurrentMonthYear();
    const daysRemaining = getDaysRemainingInMonth();

    // Get user's post counts
    const monthlyPostCount = await getMonthlyPostCount(
      userId,
      now.getFullYear(),
      now.getMonth() + 1
    );
    const lifetimePostCount = await getUserLifetimePostCount(userId);

    // Get user's earned milestones
    const earnedMonthlyMilestones = await getUserMonthlyMilestones(
      userId,
      currentMonthYear
    );
    const earnedLifetimeMilestones = await getUserLifetimeMilestones(userId);

    // Build earned milestone ID sets
    const earnedMonthlyIds = new Set(
      earnedMonthlyMilestones.map((um) => um.milestoneId)
    );
    const earnedLifetimeIds = new Set(
      earnedLifetimeMilestones.map((um) => um.milestoneId)
    );

    // Build response for monthly milestones
    const monthlyMilestonesWithEarned: MilestoneWithEarned[] = monthlyMilestones.map(
      (m) => {
        const earned = earnedMonthlyIds.has(m.id);
        const earnedRecord = earned
          ? earnedMonthlyMilestones.find((um) => um.milestoneId === m.id)
          : null;
        return {
          id: m.id,
          threshold: m.threshold,
          name: m.name,
          description: m.description,
          rewardType: m.rewardType,
          earned,
          earnedAt: earnedRecord?.earnedAt?.toISOString() ?? null,
        };
      }
    );

    // Build response for lifetime milestones
    const lifetimeMilestonesWithEarned: MilestoneWithEarned[] = lifetimeMilestones.map(
      (m) => {
        const earned = earnedLifetimeIds.has(m.id);
        const earnedRecord = earned
          ? earnedLifetimeMilestones.find((um) => um.milestoneId === m.id)
          : null;
        return {
          id: m.id,
          threshold: m.threshold,
          name: m.name,
          description: m.description,
          rewardType: m.rewardType,
          earned,
          earnedAt: earnedRecord?.earnedAt?.toISOString() ?? null,
        };
      }
    );

    // Find next unearned milestone for monthly
    const nextMonthlyMilestone = findNextMilestone(
      monthlyMilestonesWithEarned,
      monthlyPostCount
    );

    // Find next unearned milestone for lifetime
    const nextLifetimeMilestone = findNextMilestone(
      lifetimeMilestonesWithEarned,
      lifetimePostCount
    );

    const response: MilestoneProgressResponse = {
      monthly: {
        postCount: monthlyPostCount,
        currentMonth: currentMonthYear,
        daysRemaining,
        milestones: monthlyMilestonesWithEarned,
        nextMilestone: nextMonthlyMilestone,
      },
      lifetime: {
        postCount: lifetimePostCount,
        milestones: lifetimeMilestonesWithEarned,
        nextMilestone: nextLifetimeMilestone,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching milestone progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestone progress" },
      { status: 500 }
    );
  }
}

/**
 * Find the next unearned milestone above current post count
 */
function findNextMilestone(
  milestones: MilestoneWithEarned[],
  currentCount: number
): NextMilestone {
  // Sort by threshold ascending
  const sorted = [...milestones].sort((a, b) => a.threshold - b.threshold);

  // Find first unearned milestone with threshold > currentCount
  for (const m of sorted) {
    if (!m.earned && m.threshold > currentCount) {
      return {
        threshold: m.threshold,
        postsNeeded: m.threshold - currentCount,
      };
    }
  }

  return null;
}

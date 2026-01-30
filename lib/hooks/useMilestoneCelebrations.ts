"use client";

import { useEffect, useRef } from "react";
import { useMilestones, type EarnedMilestone } from "@/lib/contexts/MilestoneContext";

type MilestoneWithEarned = {
  id: string;
  threshold: number;
  name: string;
  description: string | null;
  rewardType: string;
  earned: boolean;
  earnedAt: string | null;
};

type MilestoneProgressResponse = {
  monthly: {
    postCount: number;
    currentMonth: string;
    daysRemaining: number;
    milestones: MilestoneWithEarned[];
    nextMilestone: { threshold: number; postsNeeded: number } | null;
  };
  lifetime: {
    postCount: number;
    milestones: MilestoneWithEarned[];
    nextMilestone: { threshold: number; postsNeeded: number } | null;
  };
};

/**
 * Hook to check for newly earned milestones and trigger celebrations.
 * Should be used once in the dashboard to periodically check for new achievements.
 */
export function useMilestoneCelebrations() {
  const { showMilestoneAchievements, hasSeenMilestone } = useMilestones();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only check once on mount to avoid spamming
    if (hasChecked.current) return;
    hasChecked.current = true;

    async function checkForNewMilestones() {
      try {
        const response = await fetch("/api/user/milestones");
        if (!response.ok) return;

        const data: MilestoneProgressResponse = await response.json();

        // Collect all earned milestones that haven't been celebrated
        const newMilestones: EarnedMilestone[] = [];

        // Check monthly milestones
        for (const m of data.monthly.milestones) {
          if (m.earned && m.earnedAt && !hasSeenMilestone(m.id, m.earnedAt)) {
            // Only celebrate milestones earned in the last 7 days
            const earnedDate = new Date(m.earnedAt);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            if (earnedDate > sevenDaysAgo) {
              newMilestones.push({
                id: m.id,
                name: m.name,
                description: m.description,
                rewardType: m.rewardType,
                type: "monthly",
                threshold: m.threshold,
                earnedAt: m.earnedAt,
              });
            }
          }
        }

        // Check lifetime milestones
        for (const m of data.lifetime.milestones) {
          if (m.earned && m.earnedAt && !hasSeenMilestone(m.id, m.earnedAt)) {
            // Only celebrate milestones earned in the last 7 days
            const earnedDate = new Date(m.earnedAt);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            if (earnedDate > sevenDaysAgo) {
              newMilestones.push({
                id: m.id,
                name: m.name,
                description: m.description,
                rewardType: m.rewardType,
                type: "lifetime",
                threshold: m.threshold,
                earnedAt: m.earnedAt,
              });
            }
          }
        }

        // Trigger celebrations for new milestones (most recent first)
        if (newMilestones.length > 0) {
          // Sort by earnedAt descending (most recent first)
          newMilestones.sort(
            (a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
          );
          showMilestoneAchievements(newMilestones);
        }
      } catch (error) {
        // Silently fail - celebrations are not critical
        console.error("Failed to check for milestone celebrations:", error);
      }
    }

    // Small delay to let the page settle
    const timer = setTimeout(checkForNewMilestones, 1000);
    return () => clearTimeout(timer);
  }, [showMilestoneAchievements, hasSeenMilestone]);
}

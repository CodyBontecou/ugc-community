"use client";

import { MilestoneProvider } from "@/lib/contexts/MilestoneContext";
import { MilestoneToast } from "@/components/milestones/MilestoneToast";
import { AchievementSummaryModal } from "@/components/milestones/AchievementSummaryModal";
import { MilestoneCelebrationChecker } from "@/components/milestones/MilestoneCelebrationChecker";

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <MilestoneProvider>
      {children}
      <MilestoneToast />
      <AchievementSummaryModal />
      <MilestoneCelebrationChecker />
    </MilestoneProvider>
  );
}

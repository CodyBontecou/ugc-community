"use client";

import { MilestoneProvider } from "@/lib/contexts/MilestoneContext";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import { MilestoneToast } from "@/components/milestones/MilestoneToast";
import { AchievementSummaryModal } from "@/components/milestones/AchievementSummaryModal";
import { MilestoneCelebrationChecker } from "@/components/milestones/MilestoneCelebrationChecker";

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <MilestoneProvider>
        {children}
        <MilestoneToast />
        <AchievementSummaryModal />
        <MilestoneCelebrationChecker />
      </MilestoneProvider>
    </NotificationProvider>
  );
}

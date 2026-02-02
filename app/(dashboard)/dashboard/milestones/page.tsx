import { Suspense } from "react";
import { getServerSession } from "@/lib/auth/session";
import { UserProgressionPath } from "@/components/milestones/UserProgressionPath";
import { RewardsOverview } from "@/components/milestones/RewardsOverview";
import { CreatorStatsCard } from "@/components/dashboard/creator-stats-card";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Milestones - ugc.community",
  description: "Track your progress and unlock rewards",
};

export const dynamic = "force-dynamic";

async function MilestonesContent() {
  const session = await getServerSession();
  if (!session) return null;

  const isUserAdmin = isAdmin(session.user.email);
  if (isUserAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-warm-gray-500">Milestones are for creators only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          Milestones & Rewards
        </h1>
        <p className="text-warm-gray-500">
          Track your progress and see what you've unlocked
        </p>
      </div>

      {/* Creator Stats */}
      <CreatorStatsCard />

      {/* Milestone Progress */}
      <div id="milestone-progress">
        <UserProgressionPath />
      </div>

      {/* Unlocked Rewards */}
      <RewardsOverview />
    </div>
  );
}

export default function MilestonesPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-8 max-w-4xl mx-auto">
          <div className="h-12 bg-warm-gray-200 rounded w-1/3" />
          <div className="h-48 bg-warm-gray-200 rounded-[--radius-xl]" />
          <div className="h-64 bg-warm-gray-200 rounded-[--radius-xl]" />
          <div className="h-48 bg-warm-gray-200 rounded-[--radius-xl]" />
        </div>
      }
    >
      <MilestonesContent />
    </Suspense>
  );
}

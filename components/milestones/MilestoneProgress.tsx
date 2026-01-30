"use client";

import { useEffect, useState } from "react";
import { Trophy, Calendar, Star, CheckCircle2, Circle, Target } from "lucide-react";

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

type MilestoneProgressData = {
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

function ProgressBar({ current, target }: { current: number; target: number }) {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="w-full bg-warm-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-coral to-rose rounded-full transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function MilestoneItem({ milestone }: { milestone: MilestoneWithEarned }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        milestone.earned
          ? "bg-mint-soft/10 border-mint/20"
          : "bg-warm-gray-50 border-warm-gray-100"
      }`}
    >
      {milestone.earned ? (
        <CheckCircle2 size={20} className="text-mint flex-shrink-0" />
      ) : (
        <Circle size={20} className="text-warm-gray-300 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-sm ${
            milestone.earned ? "text-warm-gray-900" : "text-warm-gray-600"
          }`}>
            {milestone.name}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            milestone.earned
              ? "bg-mint/20 text-mint"
              : "bg-warm-gray-200 text-warm-gray-500"
          }`}>
            {milestone.threshold} posts
          </span>
        </div>
        {milestone.description && (
          <p className={`text-xs mt-0.5 ${
            milestone.earned ? "text-warm-gray-600" : "text-warm-gray-400"
          }`}>
            {milestone.description}
          </p>
        )}
      </div>
    </div>
  );
}

function MilestoneSection({
  title,
  icon: Icon,
  postCount,
  milestones,
  nextMilestone,
  subtitle,
  accentColor = "coral"
}: {
  title: string;
  icon: typeof Trophy;
  postCount: number;
  milestones: MilestoneWithEarned[];
  nextMilestone: NextMilestone;
  subtitle?: string;
  accentColor?: "coral" | "lavender";
}) {
  const earnedCount = milestones.filter(m => m.earned).length;
  const nextTarget = nextMilestone?.threshold ?? (milestones.length > 0 ? milestones[milestones.length - 1].threshold : 0);

  const iconBgClass = accentColor === "coral" ? "bg-coral/10" : "bg-lavender-soft/30";
  const iconClass = accentColor === "coral" ? "text-coral" : "text-lavender";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full ${iconBgClass} flex items-center justify-center`}>
            <Icon size={16} className={iconClass} />
          </div>
          <div>
            <h3 className="font-semibold text-warm-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-xs text-warm-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-warm-gray-900">{postCount}</span>
          <span className="text-sm text-warm-gray-500 ml-1">posts</span>
        </div>
      </div>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-warm-gray-500">
            <span>Progress to next milestone</span>
            <span>{postCount} / {nextMilestone.threshold}</span>
          </div>
          <ProgressBar current={postCount} target={nextMilestone.threshold} />
          <p className="text-sm text-warm-gray-600 flex items-center gap-1.5">
            <Target size={14} className="text-coral" />
            <span className="font-medium">{nextMilestone.postsNeeded}</span> posts to go
          </p>
        </div>
      )}

      {!nextMilestone && milestones.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-mint">
          <Star size={16} />
          <span className="font-medium">All milestones achieved!</span>
        </div>
      )}

      {/* Milestone badges summary */}
      <div className="flex items-center gap-2 text-xs text-warm-gray-500">
        <span>{earnedCount} of {milestones.length} milestones earned</span>
      </div>

      {/* Milestone list */}
      <div className="space-y-2">
        {milestones.map(milestone => (
          <MilestoneItem key={milestone.id} milestone={milestone} />
        ))}
      </div>
    </div>
  );
}

export function MilestoneProgress() {
  const [data, setData] = useState<MilestoneProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMilestones() {
      try {
        const response = await fetch("/api/user/milestones");
        if (!response.ok) {
          throw new Error("Failed to fetch milestones");
        }
        const milestoneData = await response.json();
        setData(milestoneData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchMilestones();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-warm-gray-200 rounded w-1/3" />
          <div className="h-2 bg-warm-gray-100 rounded-full" />
          <div className="space-y-2">
            <div className="h-16 bg-warm-gray-100 rounded-lg" />
            <div className="h-16 bg-warm-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  // Don't render if there are no milestones defined
  if (data.monthly.milestones.length === 0 && data.lifetime.milestones.length === 0) {
    return null;
  }

  const formatMonthName = (monthYear: string) => {
    const [year, month] = monthYear.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
      <h2 className="text-lg font-semibold text-warm-gray-900 mb-6 flex items-center gap-2">
        <Trophy size={20} className="text-coral" />
        Milestone Progress
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Progress */}
        {data.monthly.milestones.length > 0 && (
          <MilestoneSection
            title="Monthly Progress"
            icon={Calendar}
            postCount={data.monthly.postCount}
            milestones={data.monthly.milestones}
            nextMilestone={data.monthly.nextMilestone}
            subtitle={`${formatMonthName(data.monthly.currentMonth)} • ${data.monthly.daysRemaining} days left`}
            accentColor="coral"
          />
        )}

        {/* Lifetime Progress */}
        {data.lifetime.milestones.length > 0 && (
          <MilestoneSection
            title="Lifetime Progress"
            icon={Star}
            postCount={data.lifetime.postCount}
            milestones={data.lifetime.milestones}
            nextMilestone={data.lifetime.nextMilestone}
            subtitle="All-time achievements"
            accentColor="lavender"
          />
        )}
      </div>
    </div>
  );
}

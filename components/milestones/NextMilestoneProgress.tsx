"use client";

import { useEffect, useState } from "react";
import {
  Target,
  Calendar,
  Star,
  Gift,
  Sparkles,
  TrendingUp,
  Globe,
  Award,
} from "lucide-react";

type NextMilestone = {
  threshold: number;
  postsNeeded: number;
  name: string;
  rewardType: string;
} | null;

type ProgressData = {
  monthly: {
    postCount: number;
    currentMonth: string;
    daysRemaining: number;
    nextMilestone: NextMilestone;
  };
  lifetime: {
    postCount: number;
    nextMilestone: NextMilestone;
  };
} | null;

const rewardIcons: Record<string, typeof Gift> = {
  directory_boost: TrendingUp,
  analytics: Sparkles,
  hosting: Globe,
  badge: Award,
  edits: Gift,
  custom_domain: Globe,
};

function ProgressBar({
  current,
  target,
  color = "coral",
}: {
  current: number;
  target: number;
  color?: "coral" | "lavender";
}) {
  const percentage = Math.min((current / target) * 100, 100);
  const gradientClass =
    color === "coral"
      ? "from-coral to-rose"
      : "from-lavender to-purple-400";

  return (
    <div className="w-full bg-warm-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function MilestoneProgressCard({
  type,
  postCount,
  nextMilestone,
  subtitle,
  accentColor,
}: {
  type: "monthly" | "lifetime";
  postCount: number;
  nextMilestone: NextMilestone;
  subtitle?: string;
  accentColor: "coral" | "lavender";
}) {
  const Icon = type === "monthly" ? Calendar : Star;
  const iconBgClass =
    accentColor === "coral" ? "bg-coral/10" : "bg-lavender-soft/30";
  const iconClass = accentColor === "coral" ? "text-coral" : "text-lavender";

  if (!nextMilestone) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-mint-soft/10 border border-mint/20">
        <div
          className={`w-8 h-8 rounded-full ${iconBgClass} flex items-center justify-center flex-shrink-0`}
        >
          <Icon size={14} className={iconClass} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-warm-gray-900">
            {type === "monthly" ? "Monthly" : "Lifetime"} Complete!
          </p>
          <p className="text-xs text-mint">All milestones achieved</p>
        </div>
        <Star size={16} className="text-mint" />
      </div>
    );
  }

  const RewardIcon = rewardIcons[nextMilestone.rewardType] ?? Gift;
  const percentage = Math.round((postCount / nextMilestone.threshold) * 100);

  return (
    <div className="p-3 rounded-lg border border-warm-gray-100 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full ${iconBgClass} flex items-center justify-center`}
          >
            <Icon size={12} className={iconClass} />
          </div>
          <span className="text-xs font-medium text-warm-gray-600">
            {type === "monthly" ? "Monthly" : "Lifetime"}
          </span>
        </div>
        <span className="text-xs text-warm-gray-400">{percentage}%</span>
      </div>

      <ProgressBar
        current={postCount}
        target={nextMilestone.threshold}
        color={accentColor}
      />

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5 text-xs text-warm-gray-600">
          <Target size={12} className={iconClass} />
          <span>
            <span className="font-semibold">{nextMilestone.postsNeeded}</span>{" "}
            more to unlock
          </span>
        </div>
        <div
          className={`flex items-center gap-1 text-xs ${
            accentColor === "coral" ? "text-coral" : "text-lavender"
          }`}
        >
          <RewardIcon size={12} />
          <span className="font-medium truncate max-w-[80px]">
            {nextMilestone.name}
          </span>
        </div>
      </div>

      {subtitle && (
        <p className="text-xs text-warm-gray-400 mt-1.5">{subtitle}</p>
      )}
    </div>
  );
}

export function NextMilestoneProgress() {
  const [data, setData] = useState<ProgressData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch("/api/user/milestones");
        if (!response.ok) return;

        const result = await response.json();

        // Find next milestone names from the milestones array
        const monthlyNext = result.monthly.nextMilestone;
        const lifetimeNext = result.lifetime.nextMilestone;

        const monthlyMilestone = monthlyNext
          ? result.monthly.milestones.find(
              (m: { threshold: number; name: string; rewardType: string }) =>
                m.threshold === monthlyNext.threshold
            )
          : null;

        const lifetimeMilestone = lifetimeNext
          ? result.lifetime.milestones.find(
              (m: { threshold: number; name: string; rewardType: string }) =>
                m.threshold === lifetimeNext.threshold
            )
          : null;

        setData({
          monthly: {
            postCount: result.monthly.postCount,
            currentMonth: result.monthly.currentMonth,
            daysRemaining: result.monthly.daysRemaining,
            nextMilestone: monthlyNext
              ? {
                  ...monthlyNext,
                  name: monthlyMilestone?.name ?? "Reward",
                  rewardType: monthlyMilestone?.rewardType ?? "gift",
                }
              : null,
          },
          lifetime: {
            postCount: result.lifetime.postCount,
            nextMilestone: lifetimeNext
              ? {
                  ...lifetimeNext,
                  name: lifetimeMilestone?.name ?? "Reward",
                  rewardType: lifetimeMilestone?.rewardType ?? "gift",
                }
              : null,
          },
        });
      } catch (error) {
        console.error("Failed to fetch milestone progress:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-warm-gray-200 rounded w-1/3" />
          <div className="h-16 bg-warm-gray-100 rounded-lg" />
          <div className="h-16 bg-warm-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Don't render if both are complete and no next milestones
  if (!data.monthly.nextMilestone && !data.lifetime.nextMilestone) {
    return null;
  }

  const formatMonthName = (monthYear: string) => {
    const [year, month] = monthYear.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short" });
  };

  return (
    <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-4">
      <h3 className="text-sm font-semibold text-warm-gray-900 mb-3 flex items-center gap-2">
        <Target size={16} className="text-coral" />
        Next Milestones
      </h3>

      <div className="space-y-2">
        {data.monthly.nextMilestone && (
          <MilestoneProgressCard
            type="monthly"
            postCount={data.monthly.postCount}
            nextMilestone={data.monthly.nextMilestone}
            subtitle={`${formatMonthName(data.monthly.currentMonth)} · ${data.monthly.daysRemaining}d left`}
            accentColor="coral"
          />
        )}

        {data.lifetime.nextMilestone && (
          <MilestoneProgressCard
            type="lifetime"
            postCount={data.lifetime.postCount}
            nextMilestone={data.lifetime.nextMilestone}
            accentColor="lavender"
          />
        )}
      </div>
    </div>
  );
}

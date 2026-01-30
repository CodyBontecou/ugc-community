"use client";

import { useEffect, useState } from "react";
import {
  Gift,
  Sparkles,
  TrendingUp,
  Globe,
  Award,
  Clock,
  CheckCircle2,
} from "lucide-react";

type ActiveReward = {
  type: string;
  name: string;
  description: string;
  earnedAt: string;
  expiresAt: string | null;
  isPermanent: boolean;
  milestoneName: string;
  daysRemaining: number | null;
};

const rewardIcons: Record<string, typeof Gift> = {
  directory_boost: TrendingUp,
  analytics: Sparkles,
  hosting: Globe,
  badge: Award,
  edits: Gift,
  custom_domain: Globe,
};

const rewardColors: Record<string, { bg: string; text: string; icon: string }> = {
  directory_boost: {
    bg: "bg-coral/10",
    text: "text-coral",
    icon: "text-coral",
  },
  analytics: {
    bg: "bg-lavender-soft/30",
    text: "text-lavender",
    icon: "text-lavender",
  },
  hosting: {
    bg: "bg-mint-soft/30",
    text: "text-mint",
    icon: "text-mint",
  },
  badge: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: "text-amber-600",
  },
  edits: {
    bg: "bg-sky-100",
    text: "text-sky-700",
    icon: "text-sky-600",
  },
  custom_domain: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    icon: "text-rose-600",
  },
};

const activeEffects: Record<string, string> = {
  directory_boost: "Your profile is boosted in the creator directory",
  analytics: "Advanced analytics dashboard is unlocked",
  hosting: "Your portfolio is live at your subdomain",
  badge: "Verified badge displayed on your profile",
  edits: "Premium editing features enabled",
  custom_domain: "Custom domain support active",
};

function isNewReward(earnedAt: string): boolean {
  const earned = new Date(earnedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - earned.getTime()) / (1000 * 60 * 60);
  return hoursDiff <= 24;
}

function NewBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-coral/20 text-coral animate-pulse">
      <Sparkles size={10} />
      New
    </span>
  );
}

function RewardCard({ reward }: { reward: ActiveReward }) {
  const Icon = rewardIcons[reward.type] ?? Gift;
  const colors = rewardColors[reward.type] ?? {
    bg: "bg-warm-gray-100",
    text: "text-warm-gray-700",
    icon: "text-warm-gray-600",
  };
  const activeEffect = activeEffects[reward.type];
  const isNew = isNewReward(reward.earnedAt);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border bg-white transition-all ${
        isNew
          ? "border-coral/30 shadow-[0_0_12px_rgba(255,154,139,0.3)]"
          : "border-warm-gray-100 hover:border-warm-gray-200"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}
      >
        <Icon size={18} className={colors.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium text-warm-gray-900">{reward.name}</h4>
          {isNew && <NewBadge />}
          {reward.isPermanent ? (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-mint-soft/20 text-mint">
              <CheckCircle2 size={12} />
              Permanent
            </span>
          ) : reward.daysRemaining !== null ? (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              <Clock size={12} />
              {reward.daysRemaining} days left
            </span>
          ) : null}
        </div>
        <p className="text-sm text-warm-gray-600 mt-0.5">{reward.description}</p>
        {activeEffect && (
          <p className="text-xs text-mint mt-1.5 flex items-center gap-1">
            <CheckCircle2 size={12} />
            {activeEffect}
          </p>
        )}
        <p className="text-xs text-warm-gray-400 mt-2">
          Earned from: {reward.milestoneName}
        </p>
      </div>
    </div>
  );
}

export function RewardsOverview() {
  const [rewards, setRewards] = useState<ActiveReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRewards() {
      try {
        const response = await fetch("/api/user/rewards");
        if (!response.ok) {
          throw new Error("Failed to fetch rewards");
        }
        const data = await response.json();
        setRewards(data.rewards);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchRewards();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-warm-gray-200 rounded w-1/3" />
          <div className="space-y-3">
            <div className="h-20 bg-warm-gray-100 rounded-lg" />
            <div className="h-20 bg-warm-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  // Don't render if there are no rewards
  if (rewards.length === 0) {
    return null;
  }

  // Separate badges from other rewards
  const badges = rewards.filter((r) => r.type === "badge");
  const featureRewards = rewards.filter((r) => r.type !== "badge");

  return (
    <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
      <h2 className="text-lg font-semibold text-warm-gray-900 mb-6 flex items-center gap-2">
        <Gift size={20} className="text-coral" />
        Unlocked Rewards
      </h2>

      {featureRewards.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-warm-gray-600">
            Active Features
          </h3>
          <div className="grid gap-3">
            {featureRewards.map((reward, index) => (
              <RewardCard key={`${reward.type}-${index}`} reward={reward} />
            ))}
          </div>
        </div>
      )}

      {badges.length > 0 && (
        <div className={`space-y-3 ${featureRewards.length > 0 ? "mt-6" : ""}`}>
          <h3 className="text-sm font-medium text-warm-gray-600">
            Achievement Badges
          </h3>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge, index) => {
              const isNew = isNewReward(badge.earnedAt);
              return (
                <div
                  key={`badge-${index}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                    isNew
                      ? "bg-amber-100 text-amber-700 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <Award size={14} />
                  {badge.name}
                  {isNew && (
                    <span className="ml-1 w-2 h-2 bg-coral rounded-full animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Check,
  Star,
  Trophy,
  Crown,
  Lock,
  Clock,
  Infinity as InfinityIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

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

type MilestoneConfig = {
  icon: ReactNode;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  reward: string;
  tooltip: string;
};

// Get visual config based on threshold position in the track
function getMilestoneConfig(
  threshold: number,
  index: number,
  isLifetime: boolean
): MilestoneConfig {
  if (isLifetime) {
    const configs: MilestoneConfig[] = [
      {
        icon: <Star size={24} />,
        color: "text-lavender",
        gradientFrom: "#8b5cf6",
        gradientTo: "#a78bfa",
        reward: "Verified Badge",
        tooltip:
          "A verified checkmark on your profile showing you're an established creator in the community.",
      },
      {
        icon: <Trophy size={24} />,
        color: "text-coral",
        gradientFrom: "#f97316",
        gradientTo: "#fb923c",
        reward: "Featured Status",
        tooltip:
          "Get highlighted in our featured creators section, driving more visibility to your portfolio.",
      },
      {
        icon: <Crown size={24} />,
        color: "text-rose",
        gradientFrom: "#e11d48",
        gradientTo: "#f43f5e",
        reward: "Custom Domain",
        tooltip:
          "Connect your own domain name (e.g., yourname.com) to your portfolio for a professional presence.",
      },
    ];
    return configs[index % configs.length];
  }

  const configs: MilestoneConfig[] = [
    {
      icon: <Check size={24} />,
      color: "text-mint",
      gradientFrom: "#10b981",
      gradientTo: "#34d399",
      reward: "Free Hosting",
      tooltip:
        "Your portfolio stays live and accessible to brands for free as long as you maintain activity.",
    },
    {
      icon: <Star size={24} />,
      color: "text-lavender",
      gradientFrom: "#8b5cf6",
      gradientTo: "#a78bfa",
      reward: "Directory Boost",
      tooltip:
        "Rank higher in search results when brands browse the creator directory.",
    },
    {
      icon: <Trophy size={24} />,
      color: "text-coral",
      gradientFrom: "#f97316",
      gradientTo: "#fb923c",
      reward: "Unlimited Edits",
      tooltip:
        "Edit your portfolio content as many times as you want with no monthly limits.",
    },
  ];
  return configs[index % configs.length];
}

function ProgressNode({
  milestone,
  index,
  isUnlocked,
  isNext,
  config,
}: {
  milestone: MilestoneWithEarned;
  index: number;
  isUnlocked: boolean;
  isNext: boolean;
  config: MilestoneConfig;
}) {
  return (
    <motion.div
      className="flex flex-col items-center flex-shrink-0"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.15 }}
    >
      {/* Node */}
      <div className="relative">
        {/* Pulsing glow for next milestone */}
        {isNext && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.1, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Main node circle */}
        <div
          className={`relative w-16 h-16 rounded-full flex items-center justify-center ${
            isUnlocked ? "bg-white shadow-lg" : "bg-warm-gray-100"
          }`}
          style={{
            background: isUnlocked
              ? `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo}) border-box`
              : undefined,
            border: isUnlocked ? "3px solid transparent" : "3px solid #e5e5e5",
          }}
        >
          {isUnlocked ? (
            <span className={config.color}>{config.icon}</span>
          ) : (
            <Lock size={20} className="text-warm-gray-400" />
          )}
        </div>
      </div>

      {/* Threshold badge */}
      <div
        className={`mt-3 text-sm font-bold ${
          isUnlocked ? "text-warm-gray-900" : "text-warm-gray-400"
        }`}
      >
        {milestone.threshold}
      </div>

      {/* Reward label with info tooltip */}
      <div
        className={`mt-1 text-xs text-center flex items-center justify-center gap-0.5 ${
          isUnlocked ? "text-warm-gray-600" : "text-warm-gray-400"
        }`}
      >
        <span className="whitespace-nowrap">{config.reward}</span>
        <InfoTooltip content={config.tooltip} />
      </div>
    </motion.div>
  );
}

function TrackConnector({
  isUnlocked,
  index,
}: {
  isUnlocked: boolean;
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div
      ref={ref}
      className="flex-shrink-0 w-16 md:w-24 h-16 flex items-center justify-center"
    >
      <svg
        width="100%"
        height="4"
        viewBox="0 0 100 4"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient
            id={`user-connector-gradient-${index}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>

        {isUnlocked ? (
          <motion.line
            x1="0"
            y1="2"
            x2="100"
            y2="2"
            stroke={`url(#user-connector-gradient-${index})`}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 0.6, delay: index * 0.15 + 0.2 }}
          />
        ) : (
          <line
            x1="0"
            y1="2"
            x2="100"
            y2="2"
            stroke="#d4d4d4"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="8 6"
          />
        )}
      </svg>
    </div>
  );
}

function ProgressionTrack({
  milestones,
  postCount,
  label,
  icon,
  subtitle,
  isLifetime,
}: {
  milestones: MilestoneWithEarned[];
  postCount: number;
  label: string;
  icon: ReactNode;
  subtitle?: string;
  isLifetime: boolean;
}) {
  // Sort milestones by threshold
  const sortedMilestones = [...milestones].sort(
    (a, b) => a.threshold - b.threshold
  );

  // Find the index of the next milestone (first unearned one above current count)
  const nextMilestoneIndex = sortedMilestones.findIndex(
    (m) => !m.earned && m.threshold > postCount
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Track label */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warm-gray-500">
          <span className="w-6 h-6 rounded-full bg-warm-gray-100 flex items-center justify-center">
            {icon}
          </span>
          {label}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-warm-gray-900">
            {postCount}
          </span>
          <span className="text-xs text-warm-gray-500">posts</span>
          {subtitle && (
            <span className="text-xs text-warm-gray-400 ml-1">• {subtitle}</span>
          )}
        </div>
      </motion.div>

      {/* Scrollable track container */}
      <div className="relative">
        {/* Horizontal scroll container */}
        <div className="overflow-x-auto overflow-y-visible scrollbar-hide -mx-4 px-4 py-4">
          <div className="flex items-start snap-x snap-mandatory min-w-max">
            {sortedMilestones.map((milestone, i) => {
              const config = getMilestoneConfig(milestone.threshold, i, isLifetime);
              const isUnlocked = milestone.earned;
              const isNext = i === nextMilestoneIndex;

              return (
                <div
                  key={milestone.id}
                  className="flex items-start snap-center"
                >
                  <ProgressNode
                    milestone={milestone}
                    index={i}
                    isUnlocked={isUnlocked}
                    isNext={isNext}
                    config={config}
                  />
                  {i < sortedMilestones.length - 1 && (
                    <TrackConnector
                      isUnlocked={isUnlocked && sortedMilestones[i + 1]?.earned}
                      index={i}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface UserProgressionPathProps {
  userId?: string; // If provided, fetches for this user (admin mode)
  className?: string;
}

export function UserProgressionPath({
  userId,
  className = "",
}: UserProgressionPathProps) {
  const [data, setData] = useState<MilestoneProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMilestones() {
      try {
        // Use admin endpoint if userId is provided, otherwise user's own endpoint
        const endpoint = userId
          ? `/api/admin/users/${userId}/milestones`
          : "/api/user/milestones";
        const response = await fetch(endpoint);
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
  }, [userId]);

  if (loading) {
    return (
      <div
        className={`bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6 ${className}`}
      >
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-warm-gray-200 rounded w-1/4" />
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-warm-gray-100 rounded-full" />
                <div className="w-8 h-4 bg-warm-gray-100 rounded" />
                <div className="w-16 h-3 bg-warm-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  // Don't render if there are no milestones defined
  if (
    data.monthly.milestones.length === 0 &&
    data.lifetime.milestones.length === 0
  ) {
    return null;
  }

  return (
    <motion.div
      className={`relative bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-mint-soft/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-lavender-soft/10 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 space-y-8">
        <h2 className="text-lg font-semibold text-warm-gray-900 flex items-center gap-2">
          <Trophy size={20} className="text-coral" />
          Milestone Progress
        </h2>

        {/* Monthly Track */}
        {data.monthly.milestones.length > 0 && (
          <ProgressionTrack
            milestones={data.monthly.milestones}
            postCount={data.monthly.postCount}
            label="Monthly"
            icon={<Clock size={14} className="text-warm-gray-500" />}
            subtitle={`${data.monthly.daysRemaining}d left`}
            isLifetime={false}
          />
        )}

        {/* Lifetime Track */}
        {data.lifetime.milestones.length > 0 && (
          <ProgressionTrack
            milestones={data.lifetime.milestones}
            postCount={data.lifetime.postCount}
            label="Lifetime"
            icon={<InfinityIcon size={14} className="text-warm-gray-500" />}
            isLifetime={true}
          />
        )}
      </div>
    </motion.div>
  );
}

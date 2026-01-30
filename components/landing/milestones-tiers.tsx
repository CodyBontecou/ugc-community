"use client";

import { motion, useInView } from "framer-motion";
import { Check, Star, Trophy, Crown, Lock, Clock, Infinity as InfinityIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useRef } from "react";

type Milestone = {
  threshold: number;
  label: string;
  sublabel: string;
  icon: ReactNode;
  rewards: string[];
  color: string;
  bgColor: string;
  gradientFrom: string;
  gradientTo: string;
  isLifetime?: boolean;
};

const monthlyMilestones: Milestone[] = [
  {
    threshold: 5,
    label: "5 Posts",
    sublabel: "per month",
    icon: <Check size={24} />,
    rewards: ["Free Hosting"],
    color: "text-mint",
    bgColor: "bg-mint-soft/30",
    gradientFrom: "#10b981",
    gradientTo: "#34d399",
  },
  {
    threshold: 15,
    label: "15 Posts",
    sublabel: "per month",
    icon: <Star size={24} />,
    rewards: ["Directory Boost"],
    color: "text-lavender",
    bgColor: "bg-lavender-soft/30",
    gradientFrom: "#8b5cf6",
    gradientTo: "#a78bfa",
  },
  {
    threshold: 30,
    label: "30 Posts",
    sublabel: "per month",
    icon: <Trophy size={24} />,
    rewards: ["Unlimited Edits"],
    color: "text-coral",
    bgColor: "bg-coral/10",
    gradientFrom: "#f97316",
    gradientTo: "#fb923c",
  },
];

const lifetimeMilestones: Milestone[] = [
  {
    threshold: 100,
    label: "100 Posts",
    sublabel: "lifetime",
    icon: <Star size={24} />,
    rewards: ["Verified Badge"],
    color: "text-lavender",
    bgColor: "bg-lavender-soft/30",
    gradientFrom: "#8b5cf6",
    gradientTo: "#a78bfa",
    isLifetime: true,
  },
  {
    threshold: 500,
    label: "500 Posts",
    sublabel: "lifetime",
    icon: <Trophy size={24} />,
    rewards: ["Featured Status"],
    color: "text-coral",
    bgColor: "bg-coral/10",
    gradientFrom: "#f97316",
    gradientTo: "#fb923c",
    isLifetime: true,
  },
  {
    threshold: 1000,
    label: "1,000 Posts",
    sublabel: "lifetime",
    icon: <Crown size={24} />,
    rewards: ["Custom Domain"],
    color: "text-rose",
    bgColor: "bg-peach-100",
    gradientFrom: "#e11d48",
    gradientTo: "#f43f5e",
    isLifetime: true,
  },
];

function ProgressNode({
  milestone,
  index,
  isUnlocked,
  isNext,
}: {
  milestone: Milestone;
  index: number;
  isUnlocked: boolean;
  isNext: boolean;
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
              background: `linear-gradient(135deg, ${milestone.gradientFrom}, ${milestone.gradientTo})`,
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
            isUnlocked
              ? "bg-white shadow-lg"
              : "bg-warm-gray-100"
          }`}
          style={{
            background: isUnlocked
              ? `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${milestone.gradientFrom}, ${milestone.gradientTo}) border-box`
              : undefined,
            border: isUnlocked ? "3px solid transparent" : "3px solid #e5e5e5",
          }}
        >
          {isUnlocked ? (
            <span className={milestone.color}>{milestone.icon}</span>
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

      {/* Reward label */}
      <div
        className={`mt-1 text-xs text-center max-w-[80px] ${
          isUnlocked ? "text-warm-gray-600" : "text-warm-gray-400"
        }`}
      >
        {milestone.rewards[0]}
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
    <div ref={ref} className="flex-shrink-0 w-16 md:w-24 h-16 flex items-center justify-center">
      <svg
        width="100%"
        height="4"
        viewBox="0 0 100 4"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`connector-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
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
            stroke={`url(#connector-gradient-${index})`}
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
  label,
  icon,
  unlockedCount = 1,
}: {
  milestones: Milestone[];
  label: string;
  icon: ReactNode;
  unlockedCount?: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Track label */}
      <motion.div
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warm-gray-500"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <span className="w-6 h-6 rounded-full bg-warm-gray-100 flex items-center justify-center">
          {icon}
        </span>
        {label}
      </motion.div>

      {/* Scrollable track container for mobile */}
      <div className="relative">
        {/* Fade edges for mobile scroll indication */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none md:hidden" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none md:hidden" />

        {/* Horizontal scroll container */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
          <div className="flex items-start snap-x snap-mandatory md:snap-none min-w-max md:min-w-0">
            {milestones.map((milestone, i) => (
              <div key={milestone.threshold} className="flex items-start snap-center">
                <ProgressNode
                  milestone={milestone}
                  index={i}
                  isUnlocked={i < unlockedCount}
                  isNext={i === unlockedCount}
                />
                {i < milestones.length - 1 && (
                  <TrackConnector isUnlocked={i < unlockedCount - 1} index={i} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProgressionPath() {
  return (
    <motion.div
      className="relative bg-white rounded-[--radius-xl] p-8 border border-warm-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-mint-soft/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-lavender-soft/20 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 space-y-10">
        {/* Monthly Track */}
        <ProgressionTrack
          milestones={monthlyMilestones}
          label="Monthly"
          icon={<Clock size={14} className="text-warm-gray-500" />}
          unlockedCount={1}
        />

        {/* Lifetime Track */}
        <ProgressionTrack
          milestones={lifetimeMilestones}
          label="Lifetime"
          icon={<InfinityIcon size={14} className="text-warm-gray-500" />}
          unlockedCount={1}
        />
      </div>
    </motion.div>
  );
}

// Keep the old export for backward compatibility if needed
export function MilestonesTiers() {
  return <ProgressionPath />;
}

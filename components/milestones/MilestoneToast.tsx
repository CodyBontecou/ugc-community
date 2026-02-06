"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Sparkles,
  TrendingUp,
  Globe,
  Award,
  X,
  PartyPopper,
} from "lucide-react";
import { useMilestones, type EarnedMilestone } from "@/lib/contexts/MilestoneContext";

const rewardIcons: Record<string, typeof Gift> = {
  directory_boost: TrendingUp,
  analytics: Sparkles,
  hosting: Globe,
  badge: Award,
  edits: Gift,
  custom_domain: Globe,
};

const rewardColors: Record<string, { bg: string; border: string; icon: string }> = {
  directory_boost: {
    bg: "bg-coral/10",
    border: "border-coral/30",
    icon: "text-coral",
  },
  analytics: {
    bg: "bg-coral/10",
    border: "border-coral/20",
    icon: "text-coral",
  },
  hosting: {
    bg: "bg-mint-soft/30",
    border: "border-mint/30",
    icon: "text-mint",
  },
  badge: {
    bg: "bg-amber-100",
    border: "border-amber-300",
    icon: "text-amber-600",
  },
  edits: {
    bg: "bg-sky-100",
    border: "border-sky-300",
    icon: "text-sky-600",
  },
  custom_domain: {
    bg: "bg-rose-100",
    border: "border-rose-300",
    icon: "text-rose-600",
  },
};

const rewardDescriptions: Record<string, string> = {
  directory_boost: "Profile boosted in creator directory",
  analytics: "Advanced analytics unlocked",
  hosting: "Portfolio hosting enabled",
  badge: "Verified badge earned",
  edits: "Premium editing features enabled",
  custom_domain: "Custom domain support active",
};

function ConfettiParticle({ delay }: { delay: number }) {
  const colors = ["bg-coral", "bg-warm-gray-900", "bg-mint", "bg-amber-400", "bg-rose-400"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const left = Math.random() * 100;
  const duration = 1.5 + Math.random() * 1;

  return (
    <motion.div
      className={`absolute w-2 h-2 rounded-full ${color}`}
      initial={{
        left: `${left}%`,
        top: -10,
        opacity: 1,
        scale: 0.5 + Math.random() * 0.5,
        rotate: 0
      }}
      animate={{
        top: "110%",
        opacity: [1, 1, 0],
        rotate: 360 + Math.random() * 360,
        x: (Math.random() - 0.5) * 100
      }}
      transition={{
        duration,
        delay,
        ease: "easeOut"
      }}
    />
  );
}

function Confetti() {
  const particles = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <ConfettiParticle key={i} delay={i * 0.05} />
      ))}
    </div>
  );
}

function SingleToast({
  milestone,
  onDismiss,
  index,
}: {
  milestone: EarnedMilestone;
  onDismiss: () => void;
  index: number;
}) {
  const Icon = rewardIcons[milestone.rewardType] ?? Gift;
  const colors = rewardColors[milestone.rewardType] ?? {
    bg: "bg-warm-gray-100",
    border: "border-warm-gray-300",
    icon: "text-warm-gray-600",
  };
  const description = rewardDescriptions[milestone.rewardType] ?? milestone.description;
  const isLifetime = milestone.type === "lifetime";

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1 - index * 0.05,
        zIndex: 100 - index
      }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`relative w-80 rounded-xl border-2 shadow-lg overflow-hidden ${colors.bg} ${colors.border}`}
      style={{ marginTop: index > 0 ? -60 : 0 }}
    >
      {isLifetime && <Confetti />}

      <div className="relative p-4">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} className="text-warm-gray-500" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          {isLifetime ? (
            <PartyPopper size={20} className="text-coral" />
          ) : (
            <Award size={20} className="text-coral" />
          )}
          <span className="text-sm font-semibold text-warm-gray-900">
            {isLifetime ? "Lifetime Achievement!" : "Milestone Reached!"}
          </span>
        </div>

        {/* Content */}
        <div className="flex items-start gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colors.bg} border ${colors.border}`}
          >
            <Icon size={22} className={colors.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-warm-gray-900 text-base">
              {milestone.name}
            </h4>
            <p className="text-sm text-warm-gray-600 mt-0.5">
              {description}
            </p>
            <p className="text-xs text-warm-gray-400 mt-1.5">
              {milestone.threshold} posts milestone
            </p>
          </div>
        </div>

        {/* Progress bar for auto-dismiss */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-warm-gray-900/10"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 5, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

export function MilestoneToast() {
  const { pendingMilestones, dismissCurrentMilestone } = useMilestones();

  const handleDismiss = useCallback(() => {
    dismissCurrentMilestone();
  }, [dismissCurrentMilestone]);

  // Don't show toasts when 2+ milestones are pending (modal handles that)
  if (pendingMilestones.length >= 2) {
    return null;
  }

  // Show single toast for single milestone
  const visibleMilestones = pendingMilestones.slice(0, 1);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse items-end">
      <AnimatePresence mode="popLayout">
        {visibleMilestones.map((milestone, index) => (
          <SingleToast
            key={`${milestone.id}-${milestone.earnedAt}`}
            milestone={milestone}
            onDismiss={handleDismiss}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

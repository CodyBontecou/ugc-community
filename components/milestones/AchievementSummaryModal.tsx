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
  Trophy,
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
    bg: "bg-lavender-soft/30",
    border: "border-lavender/30",
    icon: "text-lavender",
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
  badge: "Achievement badge earned",
  edits: "Premium editing features enabled",
  custom_domain: "Custom domain support active",
};

function ConfettiBackground() {
  const colors = ["#FF9A8B", "#A855F7", "#4ADE80", "#FCD34D", "#FF6B95"];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    size: 4 + Math.random() * 8,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
          }}
          initial={{ top: -20, opacity: 1, rotate: 0 }}
          animate={{
            top: "120%",
            opacity: [1, 1, 0],
            rotate: 360 + Math.random() * 360,
            x: (Math.random() - 0.5) * 200,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      ))}
    </div>
  );
}

function MilestoneCard({
  milestone,
  index,
}: {
  milestone: EarnedMilestone;
  index: number;
}) {
  const Icon = rewardIcons[milestone.rewardType] ?? Gift;
  const colors = rewardColors[milestone.rewardType] ?? {
    bg: "bg-warm-gray-100",
    border: "border-warm-gray-300",
    icon: "text-warm-gray-600",
  };
  const description =
    rewardDescriptions[milestone.rewardType] ?? milestone.description;
  const isLifetime = milestone.type === "lifetime";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        damping: 20,
        stiffness: 300,
      }}
      className={`p-4 rounded-xl border-2 ${colors.bg} ${colors.border}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-white border ${colors.border}`}
        >
          <Icon size={22} className={colors.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-warm-gray-900">{milestone.name}</h4>
            {isLifetime && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-lavender-soft/30 text-lavender">
                Lifetime
              </span>
            )}
          </div>
          <p className="text-sm text-warm-gray-600 mt-1">{description}</p>
          <p className="text-xs text-warm-gray-400 mt-2">
            {milestone.threshold} posts milestone
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function AchievementSummaryModal() {
  const { pendingMilestones, clearAllMilestones } = useMilestones();

  // Only show modal when 2+ milestones are pending
  const showModal = pendingMilestones.length >= 2;

  const handleClose = useCallback(() => {
    clearAllMilestones();
  }, [clearAllMilestones]);

  // Close on escape key
  useEffect(() => {
    if (!showModal) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showModal, handleClose]);

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <ConfettiBackground />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-black/5 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-warm-gray-500" />
            </button>

            {/* Content */}
            <div className="relative p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    damping: 10,
                    stiffness: 200,
                    delay: 0.2,
                  }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-coral to-rose mb-4"
                >
                  <Trophy size={32} className="text-white" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-semibold text-warm-gray-900"
                >
                  Multiple Achievements!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-warm-gray-600 mt-2"
                >
                  You unlocked {pendingMilestones.length} milestones at once
                </motion.p>
              </div>

              {/* Milestone cards */}
              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {pendingMilestones.map((milestone, index) => (
                  <MilestoneCard
                    key={`${milestone.id}-${milestone.earnedAt}`}
                    milestone={milestone}
                    index={index}
                  />
                ))}
              </div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + pendingMilestones.length * 0.1 }}
                className="mt-6 flex justify-center"
              >
                <button
                  onClick={handleClose}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-coral to-rose text-white font-medium shadow-lg shadow-coral/30 hover:shadow-xl hover:shadow-coral/40 transition-all hover:-translate-y-0.5"
                >
                  <span className="flex items-center gap-2">
                    <PartyPopper size={18} />
                    Awesome!
                  </span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

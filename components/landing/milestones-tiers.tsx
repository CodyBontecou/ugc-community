"use client";

import { motion } from "framer-motion";
import { Check, Star, Trophy, Crown } from "lucide-react";
import type { ReactNode } from "react";

type Milestone = {
  threshold: number;
  label: string;
  sublabel: string;
  icon: ReactNode;
  rewards: string[];
  color: string;
  bgColor: string;
  isLifetime?: boolean;
};

const monthlyMilestones: Milestone[] = [
  {
    threshold: 30,
    label: "30 Posts",
    sublabel: "per month",
    icon: <Check size={24} />,
    rewards: ["Free Hosting", "Directory Boost"],
    color: "text-mint",
    bgColor: "bg-mint-soft/30",
  },
];

const lifetimeMilestones: Milestone[] = [
  {
    threshold: 100,
    label: "100 Posts",
    sublabel: "lifetime",
    icon: <Star size={24} />,
    rewards: ["Verified Badge", "Advanced Analytics"],
    color: "text-lavender",
    bgColor: "bg-lavender-soft/30",
    isLifetime: true,
  },
  {
    threshold: 500,
    label: "500 Posts",
    sublabel: "lifetime",
    icon: <Trophy size={24} />,
    rewards: ["Featured Status", "Priority Support"],
    color: "text-coral",
    bgColor: "bg-coral/10",
    isLifetime: true,
  },
  {
    threshold: 1000,
    label: "1,000 Posts",
    sublabel: "lifetime",
    icon: <Crown size={24} />,
    rewards: ["Custom Domain", "Founding Creator Badge"],
    color: "text-rose",
    bgColor: "bg-peach-100",
    isLifetime: true,
  },
];

function MilestoneCard({
  milestone,
  index,
}: {
  milestone: Milestone;
  index: number;
}) {
  return (
    <motion.div
      className="relative bg-white rounded-[--radius-xl] p-6 border border-warm-gray-100 transition-all duration-300 hover:shadow-lg hover:border-warm-gray-200"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      {/* Icon badge */}
      <div
        className={`w-14 h-14 rounded-full ${milestone.bgColor} flex items-center justify-center mb-4 ${milestone.color}`}
      >
        {milestone.icon}
      </div>

      {/* Threshold */}
      <div className="mb-4">
        <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-warm-gray-900">
          {milestone.label}
        </h3>
        <p className="text-sm text-warm-gray-500">{milestone.sublabel}</p>
      </div>

      {/* Rewards list */}
      <ul className="space-y-2">
        {milestone.rewards.map((reward, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <Check size={16} className={milestone.color} />
            <span className="text-warm-gray-700">{reward}</span>
          </li>
        ))}
      </ul>

      {/* Lifetime badge */}
      {milestone.isLifetime && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
            Permanent
          </span>
        </div>
      )}
    </motion.div>
  );
}

export function MilestonesTiers() {
  return (
    <div className="space-y-12">
      {/* Monthly Milestones */}
      <div>
        <motion.h3
          className="text-lg font-semibold text-warm-gray-900 mb-6 flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="w-8 h-8 rounded-full bg-mint-soft/30 flex items-center justify-center">
            <Check size={16} className="text-mint" />
          </span>
          Monthly Goals
        </motion.h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monthlyMilestones.map((milestone, i) => (
            <MilestoneCard key={milestone.threshold} milestone={milestone} index={i} />
          ))}
        </div>
      </div>

      {/* Lifetime Milestones */}
      <div>
        <motion.h3
          className="text-lg font-semibold text-warm-gray-900 mb-6 flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="w-8 h-8 rounded-full bg-lavender-soft/30 flex items-center justify-center">
            <Trophy size={16} className="text-lavender" />
          </span>
          Lifetime Achievements
        </motion.h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lifetimeMilestones.map((milestone, i) => (
            <MilestoneCard key={milestone.threshold} milestone={milestone} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

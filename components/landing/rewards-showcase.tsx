"use client";

import { motion } from "framer-motion";
import {
  Globe,
  TrendingUp,
  Sparkles,
  Award,
  Star,
  Zap,
  Pencil,
} from "lucide-react";
import type { ReactNode } from "react";

type Reward = {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
};

const rewards: Reward[] = [
  {
    icon: <Globe size={24} />,
    title: "Free Hosting",
    description:
      "Keep your portfolio live at your custom subdomain without any monthly fees.",
    color: "text-mint",
    bgColor: "bg-mint-soft/30",
  },
  {
    icon: <TrendingUp size={24} />,
    title: "Directory Boost",
    description:
      "Get featured prominently in our creator directory for maximum brand visibility.",
    color: "text-coral",
    bgColor: "bg-coral/10",
  },
  {
    icon: <Pencil size={24} />,
    title: "Profile Edits",
    description:
      "Earn profile edit credits to update your bio, tagline, social handles, and more.",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  {
    icon: <Sparkles size={24} />,
    title: "Advanced Analytics",
    description:
      "Track profile views, visitor locations, and engagement metrics in real-time.",
    color: "text-lavender",
    bgColor: "bg-lavender-soft/30",
  },
  {
    icon: <Award size={24} />,
    title: "Verified Badge",
    description:
      "Build trust with brands by displaying a verified creator badge on your profile.",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    icon: <Star size={24} />,
    title: "Featured Status",
    description:
      "Earn permanent top placement in the directory as a featured creator.",
    color: "text-rose",
    bgColor: "bg-peach-100",
  },
  {
    icon: <Zap size={24} />,
    title: "Priority Support",
    description:
      "Get fast-track support and early access to new features and tools.",
    color: "text-sky-600",
    bgColor: "bg-sky-100",
  },
];

function RewardCard({
  reward,
  index,
}: {
  reward: Reward;
  index: number;
}) {
  return (
    <motion.div
      className="bg-white rounded-[--radius-xl] p-6 border border-warm-gray-100 transition-all duration-300 hover:shadow-lg hover:border-warm-gray-200"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div
        className={`w-12 h-12 rounded-[--radius-lg] ${reward.bgColor} flex items-center justify-center mb-4 ${reward.color}`}
      >
        {reward.icon}
      </div>
      <h3 className="font-[family-name:var(--font-body)] text-lg font-semibold mb-2 text-warm-gray-900">
        {reward.title}
      </h3>
      <p className="text-sm text-warm-gray-500 leading-relaxed">
        {reward.description}
      </p>
    </motion.div>
  );
}

export function RewardsShowcase() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rewards.map((reward, i) => (
        <RewardCard key={reward.title} reward={reward} index={i} />
      ))}
    </div>
  );
}

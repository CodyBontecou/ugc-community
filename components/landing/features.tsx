"use client";

import { motion } from "framer-motion";
import {
  Palette,
  Globe,
  Zap,
  Target,
  BarChart3,
  Repeat,
} from "lucide-react";
import type { ReactNode } from "react";

const features = [
  {
    icon: <Target size={24} />,
    title: "Job Board with Hooks",
    description:
      "Browse content jobs with specific hooks to use. Just create content naturally — no applications needed.",
  },
  {
    icon: <Repeat size={24} />,
    title: "Automatic Detection",
    description:
      "We scrape your TikTok every 12 hours and use AI to match your posts to job hooks automatically.",
  },
  {
    icon: <Globe size={24} />,
    title: "Your Own Subdomain",
    description:
      "Get a professional URL like sarah.ugc.community. Post regularly and we'll keep your portfolio live.",
  },
  {
    icon: <Palette size={24} />,
    title: "Custom Portfolio",
    description:
      "Your profile is uniquely crafted to match your brand and showcase your best work beautifully.",
  },
  {
    icon: <BarChart3 size={24} />,
    title: "Analytics Dashboard",
    description:
      "See who's viewing your profile, track your post performance, and watch your milestones grow.",
  },
  {
    icon: <Zap size={24} />,
    title: "Milestone Rewards",
    description:
      "1 post/month keeps your portfolio live. Hit 10 posts to unlock unlimited edits and premium perks.",
  },
];

function FeatureCard({
  icon,
  title,
  description,
  index,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      className="bg-white rounded-[--radius-xl] p-8 border border-warm-gray-100 transition-all duration-300 hover:shadow-lg hover:border-warm-gray-200"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="w-[52px] h-[52px] rounded-[--radius-lg] bg-gradient-to-br from-peach-100 to-peach-200 flex items-center justify-center mb-6 text-rose">
        {icon}
      </div>
      <h3 className="font-[family-name:var(--font-body)] text-xl font-semibold mb-2 text-warm-gray-900">
        {title}
      </h3>
      <p className="text-[0.95rem] text-warm-gray-500 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

export function Features() {
  return (
    <section id="features" className="relative z-[1] py-32">
      <div className="container">
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1.5 px-4 bg-peach-100 text-rose rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            Features
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)] mb-6">
            Create content,
            <br />
            <span className="gradient-text">we handle the rest</span>
          </h2>
          <p className="text-lg text-warm-gray-500 max-w-[500px] mx-auto">
            Post to TikTok using job hooks. We automatically track everything and unlock rewards.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <FeatureCard key={i} {...feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

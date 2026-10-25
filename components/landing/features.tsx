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
  { icon: <Target size={24} />, title: "Search in one place", description: "Find creator records by Reddit username, social platform, and the links they share." },
  { icon: <Repeat size={24} />, title: "New discoveries over time", description: "The subscription is being built around ongoing additions from r/UGCcreators, so you can return for new leads." },
  { icon: <Globe size={24} />, title: "Find their work", description: "Explore shared Instagram, TikTok, YouTube, and portfolio links when those details are available." },
  { icon: <Palette size={24} />, title: "Keep the context", description: "Understand where a detail came from with its source post or comment and supporting text." },
  { icon: <BarChart3 size={24} />, title: "Know what is available", description: "See which records include an email, a portfolio, or social links before you start researching." },
  { icon: <Zap size={24} />, title: "Built for your next campaign", description: "Spend less time collecting scattered links and more time reviewing creators for your brand." },
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
            Less searching,
            <br />
            <span className="gradient-text">more discovering</span>
          </h2>
          <p className="text-lg text-warm-gray-500 max-w-[500px] mx-auto">
            A clearer starting point for brands and agencies looking for their next UGC collaboration.
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

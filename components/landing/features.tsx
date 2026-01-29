"use client";

import { motion } from "framer-motion";
import {
  Palette,
  Globe,
  Zap,
  MessageCircle,
  BarChart3,
  Heart,
} from "lucide-react";
import type { ReactNode } from "react";

const features = [
  {
    icon: <Palette size={24} />,
    title: "Custom Design",
    description:
      "Your profile is uniquely crafted to match your brand and showcase your best work beautifully.",
  },
  {
    icon: <Globe size={24} />,
    title: "Your Own Subdomain",
    description:
      "Get a professional URL like sarah.ugc.community that's easy to share with brands and clients.",
  },
  {
    icon: <Zap size={24} />,
    title: "We Handle Everything",
    description:
      "From design to launch, we take care of all the technical details so you can focus on creating.",
  },
  {
    icon: <MessageCircle size={24} />,
    title: "Built-in Contact Form",
    description:
      "Let brands reach you directly. Get notifications instantly when someone wants to work with you.",
  },
  {
    icon: <BarChart3 size={24} />,
    title: "Analytics Dashboard",
    description:
      "See who's viewing your profile, where they're from, and which content performs best.",
    comingSoon: true,
  },
  {
    icon: <Heart size={24} />,
    title: "1:1 Collaboration",
    description:
      "Work directly with our team. Your input shapes every detail of your profile.",
  },
];

function FeatureCard({
  icon,
  title,
  description,
  index,
  comingSoon,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  index: number;
  comingSoon?: boolean;
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
      {comingSoon && (
        <p className="text-xs text-warm-gray-400 mt-2 italic">*Coming soon</p>
      )}
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
            Everything you need to
            <br />
            <span className="gradient-text">stand out</span>
          </h2>
          <p className="text-lg text-warm-gray-500 max-w-[500px] mx-auto">
            Built specifically for UGC creators. We handle the technical work.
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

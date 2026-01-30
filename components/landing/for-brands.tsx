"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Search,
  Bookmark,
  Users,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import type { ReactNode } from "react";

const brandFeatures = [
  {
    icon: <Search size={24} />,
    title: "Discover Creators",
    description:
      "Browse our curated directory of UGC creators. Filter by niche, location, and style to find your perfect match.",
  },
  {
    icon: <Bookmark size={24} />,
    title: "Save Favorites",
    description:
      "Build your own roster of go-to creators. Save profiles to quickly access them for future campaigns.",
  },
  {
    icon: <Briefcase size={24} />,
    title: "Post Opportunities",
    description:
      "Create job listings for your brand. Describe your needs, compensation, and let interested creators come to you.",
  },
  {
    icon: <Users size={24} />,
    title: "See Who's Interested",
    description:
      "View creator applications with their portfolios. Review their work and reach out directly to collaborate.",
  },
];

const steps = [
  {
    number: "1",
    title: "Create Your Account",
    description: "Sign up as a brand with your business email.",
  },
  {
    number: "2",
    title: "Post a Job",
    description: "Describe your campaign needs and compensation.",
  },
  {
    number: "3",
    title: "Connect",
    description: "Review interested creators and start collaborating.",
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
      className="bg-white rounded-[--radius-xl] p-6 border border-warm-gray-100 transition-all duration-300 hover:shadow-lg hover:border-warm-gray-200"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="w-12 h-12 rounded-[--radius-lg] bg-gradient-to-br from-lavender/20 to-lavender/40 flex items-center justify-center mb-4 text-lavender">
        {icon}
      </div>
      <h3 className="font-[family-name:var(--font-body)] text-lg font-semibold mb-2 text-warm-gray-900">
        {title}
      </h3>
      <p className="text-sm text-warm-gray-500 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

export function ForBrands() {
  return (
    <section id="for-brands" className="relative z-[1] py-32 bg-gradient-to-b from-white to-warm-gray-50">
      <div className="container">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1.5 px-4 bg-lavender/20 text-lavender rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            For Brands
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)] mb-6">
            Find your next
            <br />
            <span className="bg-gradient-to-r from-lavender to-purple-500 bg-clip-text text-transparent">
              creator partner
            </span>
          </h2>
          <p className="text-lg text-warm-gray-500 max-w-[560px] mx-auto">
            Skip the endless DMs and agency fees. Post opportunities, browse portfolios,
            and connect with UGC creators who are ready to work.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {brandFeatures.map((feature, i) => (
            <FeatureCard key={i} {...feature} index={i} />
          ))}
        </div>

        {/* How It Works for Brands */}
        <motion.div
          className="bg-white rounded-[--radius-2xl] border border-warm-gray-100 p-8 md:p-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Steps */}
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-2xl mb-8 text-warm-gray-900">
                Start finding creators in minutes
              </h3>
              <div className="flex flex-col gap-6">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    className="flex gap-4 items-start"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.15 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-lavender/20 flex items-center justify-center text-lavender font-semibold text-sm shrink-0">
                      {step.number}
                    </div>
                    <div>
                      <h4 className="font-semibold text-warm-gray-900 mb-1">
                        {step.title}
                      </h4>
                      <p className="text-sm text-warm-gray-500">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right side - Benefits */}
            <div className="bg-gradient-to-br from-lavender/10 to-purple-50 rounded-[--radius-xl] p-8">
              <h4 className="font-semibold text-warm-gray-900 mb-6">
                Why brands choose ugc.community
              </h4>
              <ul className="flex flex-col gap-4">
                {[
                  "Direct access to verified UGC creators",
                  "No agency middlemen or hidden fees",
                  "See real portfolios before reaching out",
                  "Post unlimited job opportunities",
                  "Simple, self-service platform",
                ].map((benefit, i) => (
                  <motion.li
                    key={i}
                    className="flex items-center gap-3 text-warm-gray-700"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <CheckCircle size={18} className="text-lavender shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
              <motion.a
                href="/sign-up"
                className="inline-flex items-center gap-2 mt-8 py-3 px-6 bg-gradient-to-r from-lavender to-purple-500 text-white font-medium rounded-full hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started
                <ArrowRight size={18} />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

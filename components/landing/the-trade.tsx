"use client";

import { motion } from "framer-motion";
import {
  Code,
  Globe,
  Palette,
  BarChart3,
  Lightbulb,
  ImageIcon,
  Video,
  Megaphone,
  Repeat2,
  Smartphone,
  ArrowRight,
} from "lucide-react";

const weProvide = [
  {
    icon: <Globe size={20} />,
    label: "Custom portfolio website",
    detail: "Designed & hosted for free",
  },
  {
    icon: <Palette size={20} />,
    label: "Ongoing site management",
    detail: "Updates, edits & maintenance",
  },
  {
    icon: <Lightbulb size={20} />,
    label: "Hooks & content briefs",
    detail: "Proven angles that perform",
  },
  {
    icon: <ImageIcon size={20} />,
    label: "Images & creative assets",
    detail: "Ready-to-use visuals",
  },
  {
    icon: <BarChart3 size={20} />,
    label: "Analytics & tracking",
    detail: "See your growth in real time",
  },
];

const youProvide = [
  {
    icon: <Video size={20} />,
    label: "Short-form content",
    detail: "TikToks, Reels, or Shorts",
  },
  {
    icon: <Smartphone size={20} />,
    label: "Post from time to time",
    detail: "No strict schedule required",
  },
  {
    icon: <Megaphone size={20} />,
    label: "Share our apps & ideas",
    detail: "Using the hooks we provide",
  },
];

function FlowArrow({ direction }: { direction: "right" | "left" }) {
  return (
    <motion.div
      className="flex items-center gap-1"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      {direction === "right" ? (
        <>
          <motion.div
            className="h-[2px] w-8 bg-gradient-to-r from-coral to-rose rounded-full"
            animate={{ scaleX: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
          />
          <ArrowRight size={16} className="text-rose -ml-1" />
        </>
      ) : (
        <>
          <ArrowRight
            size={16}
            className="text-lavender -mr-1 rotate-180"
          />
          <motion.div
            className="h-[2px] w-8 bg-gradient-to-r from-lavender to-lavender-soft rounded-full"
            animate={{ scaleX: [0.6, 1, 0.6] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            style={{ transformOrigin: "right" }}
          />
        </>
      )}
    </motion.div>
  );
}

export function TheTrade() {
  return (
    <section className="relative z-[1] py-32 overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-warm-gray-900) 1px, transparent 0)`,
        backgroundSize: "32px 32px",
      }} />

      <div className="container relative">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1.5 px-4 bg-peach-100 text-rose rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            The Exchange
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)] mb-6">
            We play to
            <br />
            <span className="gradient-text">each other's strengths</span>
          </h2>
          <p className="text-lg text-warm-gray-500 max-w-[520px] mx-auto leading-relaxed">
            A fair trade — we handle the tech, you bring the creativity.
            Everyone wins.
          </p>
        </motion.div>

        {/* The Exchange Visual */}
        <div className="max-w-[1100px] mx-auto">
          {/* Desktop layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-0 items-stretch">
            {/* WE PROVIDE - Left Card */}
            <motion.div
              className="relative bg-white rounded-[--radius-xl] border border-warm-gray-100 overflow-hidden shadow-md"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Card header accent */}
              <div className="h-1 bg-gradient-to-r from-coral via-rose to-coral-dark" />

              <div className="p-8 lg:p-10">
                {/* Card title */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-[--radius-lg] bg-gradient-to-br from-coral to-rose flex items-center justify-center shadow-[0_4px_16px_rgba(255,107,149,0.3)]">
                    <Code size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-2xl text-warm-gray-900">
                      What we bring
                    </h3>
                    <p className="text-sm text-warm-gray-400 font-medium">
                      Tech, design & strategy
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-5">
                  {weProvide.map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-start gap-4 group"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    >
                      <div className="w-10 h-10 rounded-[--radius-md] bg-peach-100 flex items-center justify-center text-rose shrink-0 transition-all duration-300 group-hover:bg-peach-200 group-hover:scale-110">
                        {item.icon}
                      </div>
                      <div className="pt-0.5">
                        <div className="font-[family-name:var(--font-body)] font-semibold text-warm-gray-800 text-[0.95rem]">
                          {item.label}
                        </div>
                        <div className="text-sm text-warm-gray-400 mt-0.5">
                          {item.detail}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* CENTER CONNECTOR */}
            <motion.div
              className="hidden lg:flex flex-col items-center justify-center px-8 relative"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Vertical dashed line */}
              <div className="absolute inset-y-12 left-1/2 -translate-x-1/2 w-px border-l border-dashed border-warm-gray-200" />

              {/* Top flow label */}
              <div className="relative z-10 mb-4">
                <div className="flex items-center gap-2 py-2 px-3 bg-peach-100 rounded-full">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose">
                    We give
                  </span>
                  <FlowArrow direction="right" />
                </div>
              </div>

              {/* Central icon */}
              <motion.div
                className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-coral via-rose to-lavender flex items-center justify-center shadow-[0_8px_32px_rgba(255,107,149,0.35)] my-4"
                animate={{ rotate: [0, 360] }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Repeat2 size={32} className="text-white" />
              </motion.div>

              {/* Bottom flow label */}
              <div className="relative z-10 mt-4">
                <div className="flex items-center gap-2 py-2 px-3 bg-[#F3EEFF] rounded-full">
                  <FlowArrow direction="left" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-lavender">
                    You give
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Mobile connector */}
            <motion.div
              className="flex lg:hidden items-center justify-center py-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 py-2 px-3 bg-peach-100 rounded-full">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose">
                    We give
                  </span>
                </div>
                <motion.div
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-coral via-rose to-lavender flex items-center justify-center shadow-[0_8px_24px_rgba(255,107,149,0.3)]"
                  animate={{ rotate: [0, 360] }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Repeat2 size={24} className="text-white" />
                </motion.div>
                <div className="flex items-center gap-2 py-2 px-3 bg-[#F3EEFF] rounded-full">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-lavender">
                    You give
                  </span>
                </div>
              </div>
            </motion.div>

            {/* YOU PROVIDE - Right Card */}
            <motion.div
              className="relative bg-white rounded-[--radius-xl] border border-warm-gray-100 overflow-hidden shadow-md"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Card header accent */}
              <div className="h-1 bg-gradient-to-r from-lavender-soft via-lavender to-purple-dark" />

              <div className="p-8 lg:p-10">
                {/* Card title */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-[--radius-lg] bg-gradient-to-br from-lavender to-purple-dark flex items-center justify-center shadow-[0_4px_16px_rgba(168,85,247,0.3)]">
                    <Megaphone size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-2xl text-warm-gray-900">
                      What you bring
                    </h3>
                    <p className="text-sm text-warm-gray-400 font-medium">
                      Content & reach
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-5">
                  {youProvide.map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-start gap-4 group"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    >
                      <div className="w-10 h-10 rounded-[--radius-md] bg-[#F3EEFF] flex items-center justify-center text-lavender shrink-0 transition-all duration-300 group-hover:bg-[#E8DEFF] group-hover:scale-110">
                        {item.icon}
                      </div>
                      <div className="pt-0.5">
                        <div className="font-[family-name:var(--font-body)] font-semibold text-warm-gray-800 text-[0.95rem]">
                          {item.label}
                        </div>
                        <div className="text-sm text-warm-gray-400 mt-0.5">
                          {item.detail}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Emphasis callout */}
                <motion.div
                  className="mt-8 p-5 rounded-[--radius-lg] bg-gradient-to-br from-[#FAFAFE] to-[#F3EEFF] border border-[#E8DEFF]"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <p className="text-sm text-warm-gray-600 leading-relaxed">
                    <span className="font-semibold text-lavender">
                      It's that simple.
                    </span>{" "}
                    We provide the hooks, images, and everything you need. You
                    just hit post.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Bottom tagline */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 py-3 px-6 bg-warm-gray-50 rounded-full border border-warm-gray-100">
              <div className="flex -space-x-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-coral to-rose border-2 border-white" />
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-lavender to-purple-dark border-2 border-white" />
              </div>
              <span className="text-sm font-medium text-warm-gray-600">
                You focus on creating — we handle everything else
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

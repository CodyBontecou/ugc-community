"use client";

import { motion } from "framer-motion";
import { Gift, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProgressionPath } from "./milestones-tiers";
import { RewardsShowcase } from "./rewards-showcase";

export function MilestonesRewards() {
  return (
    <section id="rewards" className="relative z-[1] py-32">
      <div className="container">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 py-1.5 px-4 bg-peach-100 text-rose rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            <Gift size={14} />
            Rewards
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)] mb-6">
            Your content
            <br />
            <span className="gradient-text">unlocks rewards</span>
          </h2>
          <p className="text-lg text-warm-gray-500 max-w-[600px] mx-auto">
            The more you create, the more you earn. Hit milestones to unlock
            exclusive features and recognition.
          </p>
        </motion.div>

        {/* Progression Path */}
        <div className="mb-20">
          <ProgressionPath />
        </div>

        {/* Rewards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl font-semibold text-warm-gray-900 mb-8 text-center">
            Available Rewards
          </h3>
          <RewardsShowcase />
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-coral to-rose text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Start Earning Rewards
            <ArrowRight size={18} />
          </Link>
          <p className="text-sm text-warm-gray-500 mt-4">
            Free to join • No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
}

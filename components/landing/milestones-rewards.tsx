"use client";

import { motion } from "framer-motion";
import { Gift, ArrowRight, UserPlus, Rocket, Trophy, Crown } from "lucide-react";
import Link from "next/link";
import { MilestonesTiers } from "./milestones-tiers";
import { RewardsShowcase } from "./rewards-showcase";

const journeySteps = [
  {
    icon: <UserPlus size={20} />,
    label: "New Creator",
    description: "Sign up free",
  },
  {
    icon: <Rocket size={20} />,
    label: "Hosted Creator",
    description: "5 posts/month",
  },
  {
    icon: <Trophy size={20} />,
    label: "Active Creator",
    description: "15 posts/month",
  },
  {
    icon: <Crown size={20} />,
    label: "Power Creator",
    description: "30 posts/month",
  },
];

function CreatorJourney() {
  return (
    <motion.div
      className="relative bg-gradient-to-r from-peach-50 to-lavender-soft/20 rounded-[--radius-xl] p-8 border border-warm-gray-100 mb-16 overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-coral/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-mint-soft/30 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10">
        <h3 className="text-xl font-semibold text-warm-gray-900 mb-8 text-center">
          Your Creator Journey
        </h3>

        {/* Desktop: Horizontal flow */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {journeySteps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1">
              <motion.div
                className="flex flex-col items-center text-center flex-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                    i === 0
                      ? "bg-warm-gray-100 text-warm-gray-600"
                      : i === 1
                        ? "bg-mint-soft/30 text-mint"
                        : i === 2
                          ? "bg-lavender-soft/30 text-lavender"
                          : "bg-coral/10 text-coral"
                  }`}
                >
                  {step.icon}
                </div>
                <h4 className="font-semibold text-warm-gray-900 text-sm">
                  {step.label}
                </h4>
                <p className="text-xs text-warm-gray-500 mt-1">
                  {step.description}
                </p>
              </motion.div>

              {i < journeySteps.length - 1 && (
                <motion.div
                  className="text-warm-gray-300 mx-2 flex-shrink-0"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.15 + 0.1 }}
                >
                  <ArrowRight size={24} />
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: Vertical flow */}
        <div className="md:hidden space-y-4">
          {journeySteps.map((step, i) => (
            <motion.div
              key={step.label}
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  i === 0
                    ? "bg-warm-gray-100 text-warm-gray-600"
                    : i === 1
                      ? "bg-mint-soft/30 text-mint"
                      : i === 2
                        ? "bg-lavender-soft/30 text-lavender"
                        : "bg-coral/10 text-coral"
                }`}
              >
                {step.icon}
              </div>
              <div>
                <h4 className="font-semibold text-warm-gray-900 text-sm">
                  {step.label}
                </h4>
                <p className="text-xs text-warm-gray-500">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

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

        {/* Creator Journey Roadmap */}
        <CreatorJourney />

        {/* Milestones Section */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl font-semibold text-warm-gray-900 mb-8 text-center">
            Milestone Tiers
          </h3>
          <MilestonesTiers />
        </motion.div>

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

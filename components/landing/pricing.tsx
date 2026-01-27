"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Perfect for getting started",
    price: "$0",
    period: "/month",
    featured: false,
    features: [
      "1 portfolio page",
      "5 video uploads",
      "Basic templates",
      "yourname.ugc.community",
      "Contact form",
    ],
    cta: "Get Started Free",
  },
  {
    name: "Creator Pro",
    description: "For serious creators",
    price: "$12",
    period: "/month",
    featured: true,
    badge: "Most Popular",
    features: [
      "Unlimited pages",
      "Unlimited uploads",
      "Premium templates",
      "Analytics dashboard",
      "Custom branding",
      "Priority support",
      "Remove ugc.community badge",
    ],
    cta: "Start 14-day Free Trial",
  },
  {
    name: "Agency",
    description: "For teams & managers",
    price: "$49",
    period: "/month",
    featured: false,
    features: [
      "Everything in Pro",
      "Up to 10 creator profiles",
      "Team collaboration",
      "White-label option",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact Sales",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative z-[1] py-32">
      <div className="container">
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1.5 px-4 bg-peach-100 text-rose rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            Pricing
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)] mb-6">
            Simple pricing,
            <br />
            <span className="gradient-text">no surprises</span>
          </h2>
          <p className="text-lg text-warm-gray-500 max-w-[500px] mx-auto">
            Start free, upgrade when you're ready to grow.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              className={`bg-white rounded-[--radius-xl] p-8 border relative ${
                plan.featured
                  ? "border-2 border-rose shadow-lg shadow-peach-100 scale-[1.02] md:order-none order-first"
                  : "border-warm-gray-100"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 py-1.5 px-4 bg-gradient-to-br from-coral to-rose text-white text-xs font-semibold rounded-full uppercase tracking-wider">
                  {plan.badge}
                </div>
              )}
              <div className="text-center mb-8 pb-8 border-b border-warm-gray-100">
                <h3 className="font-[family-name:var(--font-body)] font-semibold text-2xl text-warm-gray-900 mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-warm-gray-500 mb-6">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-[family-name:var(--font-display)] text-5xl text-warm-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-base text-warm-gray-500">
                    {plan.period}
                  </span>
                </div>
              </div>
              <ul className="flex flex-col gap-4 mb-8">
                {plan.features.map((feature, j) => (
                  <li
                    key={j}
                    className="flex items-center gap-2 text-[0.95rem] text-warm-gray-700"
                  >
                    <Check size={18} className="text-mint shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <motion.button
                className={`w-full py-4 px-8 rounded-full font-medium text-base transition-all ${
                  plan.featured
                    ? "bg-gradient-to-br from-coral to-rose text-white shadow-[0_4px_20px_rgba(255,107,149,0.25)]"
                    : "bg-white text-warm-gray-800 border border-warm-gray-200 hover:border-warm-gray-300 hover:bg-warm-gray-50"
                }`}
                whileHover={
                  plan.featured
                    ? {
                        scale: 1.02,
                        boxShadow: "0 20px 40px rgba(255, 107, 149, 0.3)",
                      }
                    : { scale: 1.02 }
                }
                whileTap={{ scale: 0.98 }}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

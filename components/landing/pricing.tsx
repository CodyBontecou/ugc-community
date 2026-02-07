"use client";

import { motion } from "framer-motion";
import { Check, AtSign } from "lucide-react";
import { track } from "@vercel/analytics";

const plans = [
  {
    name: "Creator Partner",
    description: "Free forever with content",
    price: "Free",
    period: "",
    featured: true,
    badge: "Most Popular",
    commitment: "Earn rewards by posting",
    features: [
      "Unlimited pages",
      "Unlimited uploads",
      "Premium templates",
      "Analytics dashboard",
      "Custom branding",
      "Priority support",
      "Remove ugc.community badge",
    ],
    cta: "Become a Partner",
    footnote: "@ugc.community",
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
            Pay with posts,
            <br />
            <span className="gradient-text">not payments</span>
          </h2>
          <p className="text-lg text-warm-gray-500 max-w-[560px] mx-auto">
            We'd rather have your content than your money. Tag @ugc.community
            to unlock rewards—from free hosting to unlimited edits and beyond.
          </p>
        </motion.div>

        <div className="flex justify-center max-w-md mx-auto">
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
                  {plan.period && (
                    <span className="text-base text-warm-gray-500">
                      {plan.period}
                    </span>
                  )}
                </div>
                {plan.commitment && (
                  <div className="mt-3 inline-flex items-center gap-1.5 py-1.5 px-3 bg-peach-100 text-rose rounded-full text-xs font-medium">
                    {plan.commitment}
                  </div>
                )}
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
              <motion.a
                href="/sign-up"
                className={`block w-full py-4 px-8 rounded-full font-medium text-base text-center transition-all ${
                  plan.featured
                    ? "bg-gradient-to-r from-coral to-rose text-white hover:opacity-90"
                    : "bg-white text-warm-gray-800 border border-warm-gray-200 hover:border-warm-gray-300 hover:bg-warm-gray-50"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => track("pricing_cta_click", { plan: plan.name })}
              >
                {plan.cta}
              </motion.a>
              {plan.footnote && (
                <div className="mt-4 flex items-center justify-center gap-1 text-xs text-warm-gray-500">
                  <AtSign size={12} className="text-rose" />
                  <span>Tag <span className="font-medium text-rose">{plan.footnote}</span></span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";

const steps = [
  { step: "01", title: "Find a brief that fits", description: "Search the feed and filter by source or compensation. Check whether a role offers guaranteed cash, variable pay, or gifted products." },
  { step: "02", title: "Read the terms", description: "Review the deliverables, eligibility, usage rights, source date, and closing date. External details that were not stated stay visibly marked." },
  { step: "03", title: "Apply directly", description: "Use the original application destination to reach the employer. Brands handle applications through their own process." },
];

export function HowItWorks() {
  return (
    <section className="relative z-[1] py-16 sm:py-24 lg:py-32">
      <div className="container">
        <motion.div
          className="text-center mb-12 sm:mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1.5 px-4 bg-peach-100 text-rose rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            How It Works
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)]">
            Discover. Review.
            <br />
            <span className="gradient-text">Find your next fit.</span>
          </h2>
        </motion.div>

        <div className="max-w-[700px] mx-auto flex flex-col gap-12">
          {steps.map((item, i) => (
            <motion.div
              key={i}
              className="flex gap-4 sm:gap-8 items-start"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
            >
              <div className="font-[family-name:var(--font-display)] text-5xl gradient-text leading-none shrink-0">
                {item.step}
              </div>
              <div className="min-w-0">
                <h3 className="font-[family-name:var(--font-body)] font-semibold text-xl text-warm-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-warm-gray-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

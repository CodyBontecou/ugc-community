"use client";

import { motion } from "framer-motion";

const steps = [
  { step: "01", title: "Discover creators", description: "Search the database for creator records and filter by the platforms and contact fields that matter to you." },
  { step: "02", title: "Review the source", description: "Check shared work and the original Reddit context. A public mention is a starting point; confirm fit and availability directly." },
  { step: "03", title: "Come back for new discoveries", description: "The planned subscription will include database additions as new uploads are processed, rather than a single frozen download." },
];

export function HowItWorks() {
  return (
    <section className="relative z-[1] py-32">
      <div className="container">
        <motion.div
          className="text-center mb-24"
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
              className="flex gap-8 items-start"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
            >
              <div className="font-[family-name:var(--font-display)] text-5xl gradient-text leading-none shrink-0">
                {item.step}
              </div>
              <div>
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

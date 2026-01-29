"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative z-[1] py-32">
      <div className="container">
        <motion.div
          className="bg-gradient-to-br from-coral via-rose to-lavender rounded-[--radius-2xl] p-16 text-center shadow-glow"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-[clamp(2rem,4vw,2.75rem)] text-white mb-4">
            Ready to level up your creator game?
          </h2>
          <p className="text-lg text-white/90 mb-12">
            Join thousands of UGC creators who've already made the switch.
          </p>
          <motion.a
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 font-medium rounded-full py-4 px-8 text-base bg-white text-warm-gray-900 shadow-md hover:shadow-lg transition-shadow"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started
            <ArrowRight size={18} />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

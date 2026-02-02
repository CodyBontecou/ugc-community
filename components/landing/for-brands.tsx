"use client";

import { motion } from "framer-motion";
import { Briefcase, Mail, ArrowRight } from "lucide-react";

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
            Looking for
            <br />
            <span className="bg-gradient-to-r from-lavender to-purple-500 bg-clip-text text-transparent">
              UGC creators?
            </span>
          </h2>
          <p className="text-lg text-warm-gray-500 max-w-[560px] mx-auto">
            We're building tools to help brands discover and connect with talented UGC creators.
            Reach out to learn more about early access.
          </p>
        </motion.div>

        {/* Coming Soon Card */}
        <motion.div
          className="max-w-2xl mx-auto bg-white rounded-[--radius-2xl] border border-warm-gray-100 p-8 md:p-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-16 h-16 rounded-full bg-lavender/20 flex items-center justify-center mx-auto mb-6">
            <Briefcase size={32} className="text-lavender" />
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-2xl mb-4 text-warm-gray-900">
            Brand Features Coming Soon
          </h3>
          <p className="text-warm-gray-500 mb-8 max-w-md mx-auto">
            We're focused on building the best platform for creators right now.
            Brand tools for discovering and hiring creators are on our roadmap.
          </p>
          <a
            href="mailto:brands@ugc.community"
            className="inline-flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-lavender to-purple-500 text-white font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            <Mail size={18} />
            Contact Us for Early Access
            <ArrowRight size={18} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

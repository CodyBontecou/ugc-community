"use client";

import { motion } from "framer-motion";
import { Camera, Instagram, ArrowRight } from "lucide-react";

const portfolios = [
  {
    name: "Dany",
    handle: "dany",
    niche: "Lifestyle & Beauty",
    followers: "245K",
    gradient: "linear-gradient(135deg, #FF9A8B, #FF6B95)",
  },
  {
    name: "Marcus",
    handle: "marcus",
    niche: "Tech Reviews",
    followers: "189K",
    gradient: "linear-gradient(135deg, #667eea, #764ba2)",
  },
  {
    name: "Sophia",
    handle: "sophia",
    niche: "Food & Recipe",
    followers: "412K",
    gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
  },
];

export function PortfolioExamples() {
  return (
    <section id="portfolios" className="relative z-[1] py-32 bg-warm-gray-50">
      <div className="container">
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1.5 px-4 bg-peach-100 text-rose rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            Examples
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)] mb-6">
            See what creators
            <br />
            <span className="gradient-text">are building</span>
          </h2>
          <p className="text-lg text-warm-gray-500 max-w-[500px] mx-auto">
            Get inspired by portfolios from our community of creators.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portfolios.map((creator, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-[--radius-xl] overflow-hidden border border-warm-gray-100 transition-all duration-300 hover:shadow-xl"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
            >
              <div
                className="p-8 flex flex-col items-center gap-6 min-h-[220px]"
                style={{ background: creator.gradient }}
              >
                <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white">
                  <Camera size={24} />
                </div>
                <div className="flex gap-2">
                  <div className="w-[50px] h-20 bg-white/30 backdrop-blur-sm rounded-[--radius-sm]" />
                  <div className="w-[50px] h-20 bg-white/30 backdrop-blur-sm rounded-[--radius-sm]" />
                  <div className="w-[50px] h-20 bg-white/30 backdrop-blur-sm rounded-[--radius-sm]" />
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-[family-name:var(--font-body)] font-semibold text-[1.1rem] text-warm-gray-900 mb-0.5">
                      {creator.name}
                    </h3>
                    <span className="text-xs text-warm-gray-400">
                      {creator.handle}.ugc.community
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-warm-gray-600">
                    <Instagram size={14} className="text-rose" />
                    <span>{creator.followers}</span>
                  </div>
                </div>
                <p className="text-sm text-warm-gray-500 mb-4">
                  {creator.niche}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-1 text-sm font-medium text-rose hover:gap-2 transition-all"
                >
                  Visit Portfolio <ArrowRight size={14} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

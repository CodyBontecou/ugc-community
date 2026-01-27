"use client";

import { motion } from "framer-motion";

export function SocialProof() {
  return (
    <section className="relative z-[1] py-24 text-center">
      <div className="container">
        <motion.p
          className="text-sm text-warm-gray-500 mb-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Join creators already using ugc.community
        </motion.p>
        <div className="flex justify-center items-center">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <motion.div
              key={i}
              className="w-11 h-11 rounded-full border-[3px] border-cream shadow-sm -ml-3 first:ml-0"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: `linear-gradient(135deg,
                  hsl(${(i * 40) % 360}, 70%, 70%),
                  hsl(${(i * 40 + 60) % 360}, 60%, 60%))`,
              }}
            />
          ))}
          <div className="w-11 h-11 rounded-full border-[3px] border-cream shadow-sm -ml-3 bg-warm-gray-800 text-white text-[0.7rem] font-semibold flex items-center justify-center">
            +1.2k
          </div>
        </div>
      </div>
    </section>
  );
}

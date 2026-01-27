"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "I landed 3 brand deals in my first month after launching my ugc.community portfolio. The design is so professional!",
    author: "Jessica K.",
    role: "Beauty Creator",
    rating: 5,
  },
  {
    quote:
      "Finally a portfolio builder that actually understands UGC creators. The analytics help me show brands my real impact.",
    author: "Marcus T.",
    role: "Tech Reviewer",
    rating: 5,
  },
  {
    quote:
      "Setting up took 10 minutes. Now I just send brands my link and they're immediately impressed. Worth every penny.",
    author: "Sophia M.",
    role: "Lifestyle Creator",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="relative z-[1] py-32 bg-warm-gray-50">
      <div className="container">
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1.5 px-4 bg-peach-100 text-rose rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            Testimonials
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)]">
            Loved by
            <br />
            <span className="gradient-text">creators</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-[--radius-xl] p-8 border border-warm-gray-100"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex gap-0.5 mb-6 text-[#FBBF24]">
                {[...Array(testimonial.rating)].map((_, j) => (
                  <Star key={j} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-base text-warm-gray-700 leading-relaxed mb-8">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, hsl(${i * 60}, 70%, 70%), hsl(${i * 60 + 40}, 60%, 60%))`,
                  }}
                />
                <div>
                  <span className="block font-semibold text-[0.95rem] text-warm-gray-900">
                    {testimonial.author}
                  </span>
                  <span className="block text-xs text-warm-gray-500">
                    {testimonial.role}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

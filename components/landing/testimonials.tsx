"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import Image from "next/image";

interface TestimonialsProps {
  authorImage?: string | null;
}

export function Testimonials({ authorImage }: TestimonialsProps) {
  return (
    <section className="relative z-[1] py-32 bg-warm-gray-50">
      <div className="container">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1.5 px-4 bg-peach-100 text-rose rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            Testimonial
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)]">
            Loved by
            <br />
            <span className="gradient-text">creators</span>
          </h2>
        </motion.div>

        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-[--radius-xl] p-10 md:p-12 border border-warm-gray-100 relative">
            {/* Quote icon */}
            <div className="absolute -top-5 left-10 w-10 h-10 rounded-full bg-gradient-to-br from-peach-200 to-rose/20 flex items-center justify-center">
              <Quote size={20} className="text-rose" />
            </div>

            {/* Stars */}
            <div className="flex gap-0.5 mb-6 text-[#FBBF24]">
              {[...Array(5)].map((_, j) => (
                <Star key={j} size={18} fill="currentColor" />
              ))}
            </div>

            {/* Quote */}
            <p className="text-xl md:text-2xl text-warm-gray-700 leading-relaxed mb-10 font-light">
              "ugc.community gave me a professional portfolio that truly
              represents my brand. Now when I reach out to companies, I just
              send them my link and they can see everything—my work, my stats,
              my style—all in one beautiful place. It's helped me land more
              brand deals and look way more professional."
            </p>

            {/* Author */}
            <div className="flex items-center gap-4">
              {authorImage ? (
                <Image
                  src={authorImage}
                  alt="Daniela"
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(340, 70%, 70%), hsl(20, 60%, 60%))",
                  }}
                />
              )}
              <div>
                <span className="block font-semibold text-lg text-warm-gray-900">
                  Daniela
                </span>
                <span className="block text-sm text-warm-gray-500">
                  UGC Creator & Content Strategist
                </span>
                <a
                  href="https://daniela.ugc.community"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-rose hover:underline"
                >
                  daniela.ugc.community
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { Instagram, ArrowRight, User } from "lucide-react";

export interface FeaturedCreator {
  id: string;
  name: string;
  subdomain: string;
  bio: string | null;
  image: string | null;
  instagramHandle: string | null;
}

interface PortfolioExamplesProps {
  creators: FeaturedCreator[];
}

export function PortfolioExamples({ creators }: PortfolioExamplesProps) {
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

        {creators.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-warm-gray-100 flex items-center justify-center mx-auto mb-6">
              <User size={32} className="text-warm-gray-400" />
            </div>
            <p className="text-warm-gray-500">
              Be the first to create your portfolio!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {creators.map((creator, i) => (
              <motion.div
                key={creator.id}
                className="bg-white rounded-[--radius-xl] overflow-hidden border border-warm-gray-100 transition-all duration-300 hover:shadow-xl"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <div className="relative h-[280px] overflow-hidden bg-warm-gray-100">
                  <iframe
                    src={`/s/${creator.subdomain}`}
                    title={`${creator.name}'s portfolio preview`}
                    className="absolute top-0 left-0 w-[400%] h-[400%] origin-top-left pointer-events-none"
                    style={{ transform: "scale(0.25)" }}
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-[family-name:var(--font-body)] font-semibold text-[1.1rem] text-warm-gray-900 mb-0.5">
                        {creator.name}
                      </h3>
                      <span className="text-xs text-warm-gray-400">
                        {creator.subdomain}.ugc.community
                      </span>
                    </div>
                    {creator.instagramHandle && (
                      <a
                        href={`https://instagram.com/${creator.instagramHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-warm-gray-600 hover:text-rose transition-colors"
                      >
                        <Instagram size={14} className="text-rose" />
                        <span>@{creator.instagramHandle}</span>
                      </a>
                    )}
                  </div>
                  {creator.bio && (
                    <p className="text-sm text-warm-gray-500 mb-4 line-clamp-2">
                      {creator.bio}
                    </p>
                  )}
                  <a
                    href={`https://${creator.subdomain}.ugc.community`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-rose hover:gap-2 transition-all"
                  >
                    Visit Portfolio <ArrowRight size={14} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

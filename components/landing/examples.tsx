"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

const examples = [
  {
    name: "Daniela",
    role: "UGC Creator & Content Strategist",
    url: "https://daniela.ugc.community",
    image: "/examples/daniela-preview.png",
    stats: {
      views: "2.2M+",
      brands: "10+",
      third: { value: "100%", label: "Satisfaction" },
    },
  },
  {
    name: "Cass Collins",
    role: "UGC Creator · Fashion, Travel & Tech · NYC",
    url: "https://cassanncoll.ugc.community",
    image: "/examples/cassanncoll-preview.png",
    stats: {
      views: "46.5K+",
      brands: "10+",
      third: { value: "8K+", label: "Followers" },
    },
  },
];

export function Examples() {
  return (
    <section id="examples" className="relative z-[1] py-32">
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
            See it in
            <br />
            <span className="gradient-text">action</span>
          </h2>
          <p className="text-lg text-warm-gray-500 max-w-[500px] mx-auto">
            Real creator portfolios built on ugc.community
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {examples.map((example, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-[--radius-xl] border border-warm-gray-100 overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {/* Browser Chrome */}
              <div className="bg-warm-gray-50 border-b border-warm-gray-100 px-3 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-warm-gray-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warm-gray-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warm-gray-200" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white rounded-md px-3 py-1 text-xs text-warm-gray-500 border border-warm-gray-100 w-full text-center truncate">
                    {example.url.replace("https://", "")}
                  </div>
                </div>
              </div>

              {/* Preview Image / iframe */}
              <a
                href={example.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative group"
              >
                <div className="relative aspect-[4/3] bg-warm-gray-50 overflow-hidden">
                  <iframe
                    src={example.url}
                    className="w-full h-full border-0 pointer-events-none"
                    title={`${example.name}'s portfolio`}
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-warm-gray-900/0 group-hover:bg-warm-gray-900/60 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 bg-white text-warm-gray-900 px-5 py-2.5 rounded-full font-semibold shadow-lg text-sm">
                      <span>Visit Site</span>
                      <ExternalLink size={16} />
                    </div>
                  </div>
                </div>
              </a>

              {/* Creator Info */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-base text-warm-gray-900">
                    {example.name}
                  </h3>
                  <p className="text-warm-gray-500 text-xs">{example.role}</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="font-semibold text-sm text-warm-gray-900">
                      {example.stats.views}
                    </div>
                    <div className="text-xs text-warm-gray-500">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm text-warm-gray-900">
                      {example.stats.brands}
                    </div>
                    <div className="text-xs text-warm-gray-500">Brands</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm text-warm-gray-900">
                      {example.stats.third.value}
                    </div>
                    <div className="text-xs text-warm-gray-500">{example.stats.third.label}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

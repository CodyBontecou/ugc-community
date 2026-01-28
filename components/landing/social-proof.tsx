"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export interface CreatorAvatar {
  id: string;
  name: string;
  image: string | null;
}

interface SocialProofProps {
  creatorCount: number;
  creators: CreatorAvatar[];
}

export function SocialProof({ creatorCount, creators }: SocialProofProps) {
  const displayAvatars = creators.slice(0, 8);
  const remainingCount = creatorCount - displayAvatars.length;

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
          {displayAvatars.map((creator, i) => (
            <motion.div
              key={creator.id}
              className="w-11 h-11 rounded-full border-[3px] border-cream shadow-sm -ml-3 first:ml-0 overflow-hidden"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              {creator.image ? (
                <Image
                  src={creator.image}
                  alt={creator.name}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background: `linear-gradient(135deg,
                      hsl(${(i * 40) % 360}, 70%, 70%),
                      hsl(${(i * 40 + 60) % 360}, 60%, 60%))`,
                  }}
                />
              )}
            </motion.div>
          ))}
          {remainingCount > 0 && (
            <div className="w-11 h-11 rounded-full border-[3px] border-cream shadow-sm -ml-3 bg-warm-gray-800 text-white text-[0.7rem] font-semibold flex items-center justify-center">
              +{remainingCount >= 1000 ? `${(remainingCount / 1000).toFixed(1)}k` : remainingCount}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  MapPin,
  ArrowUpRight,
  Sparkles,
  BadgeCheck,
  Eye,
  Instagram,
  Youtube,
} from "lucide-react";
import { NICHE_LABELS, type Niche } from "@/lib/directory/constants";
import type { DirectoryCreator } from "@/lib/directory/queries";

// TikTok icon (lucide doesn't have one)
function TikTokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.72a8.16 8.16 0 004.76 1.52V6.79a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}

// Niche emoji mapping for visual flair
const NICHE_EMOJIS: Record<string, string> = {
  beauty: "✨",
  fashion: "👗",
  tech: "⚡",
  lifestyle: "🌿",
  food: "🍕",
  fitness: "💪",
  travel: "✈️",
  gaming: "🎮",
  parenting: "👶",
  home: "🏡",
  pets: "🐾",
  finance: "💰",
  health: "🧘",
  automotive: "🚗",
  sports: "⚽",
  entertainment: "🎬",
};

interface CreatorCardProps {
  creator: DirectoryCreator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const name = creator.displayName || creator.name;
  const niches = (creator.niches || []).slice(0, 3) as Niche[];
  const hasLocation = creator.locationCity || creator.locationCountry;
  const locationText = [creator.locationCity, creator.locationCountry]
    .filter(Boolean)
    .join(", ");

  const hasSocials =
    (creator.instagramHandles?.length ?? 0) > 0 ||
    (creator.tiktokHandles?.length ?? 0) > 0 ||
    (creator.youtubeHandles?.length ?? 0) > 0;

  return (
    <Link href={`/creators/${creator.subdomain}`} className="block group">
      <motion.div
        className="card-gradient-border relative bg-white rounded-[--radius-xl] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Featured / Boosted badge */}
        {creator.isBoosted && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-lg shadow-amber-500/25">
            <Sparkles size={10} />
            Featured
          </div>
        )}

        {/* Top section — Avatar + Identity */}
        <div className="p-6 pb-0">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-warm-gray-100 group-hover:ring-coral/30 transition-all duration-500 shadow-md">
                {creator.image ? (
                  <img
                    src={creator.image}
                    alt={name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white text-xl font-semibold">
                    {name.charAt(0)}
                  </div>
                )}
              </div>
              {/* Available indicator */}
              {creator.availableForHire && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 border-[2.5px] border-white rounded-lg shadow-sm" />
              )}
            </div>

            {/* Name + Tagline */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-2">
                <h3 className="font-[family-name:var(--font-display)] text-xl text-warm-gray-900 truncate leading-tight">
                  {name}
                </h3>
                {creator.isVerified && (
                  <BadgeCheck
                    size={17}
                    className="text-sky shrink-0"
                  />
                )}
              </div>

              {creator.tagline && (
                <p className="text-[13px] text-warm-gray-500 line-clamp-2 mt-1 leading-relaxed">
                  {creator.tagline}
                </p>
              )}

              {hasLocation && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-warm-gray-400">
                  <MapPin size={11} />
                  <span className="truncate">{locationText}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Niches */}
        {niches.length > 0 && (
          <div className="px-6 pt-4 flex flex-wrap gap-2">
            {niches.map((niche) => (
              <span
                key={niche}
                className="inline-flex items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-semibold bg-warm-gray-50 text-warm-gray-600 border border-warm-gray-100 group-hover:bg-peach-100 group-hover:text-coral-dark group-hover:border-peach-200 transition-all duration-300"
              >
                <span>{NICHE_EMOJIS[niche] || "📌"}</span>
                {NICHE_LABELS[niche] || niche}
              </span>
            ))}
          </div>
        )}

        {/* Footer bar */}
        <div className="mt-5 mx-4 mb-4 px-4 py-3 bg-warm-gray-50/80 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Social icons */}
            {hasSocials && (
              <div className="flex items-center gap-2.5 text-warm-gray-400">
                {(creator.instagramHandles?.length ?? 0) > 0 && (
                  <Instagram size={14} className="hover:text-rose transition-colors" />
                )}
                {(creator.tiktokHandles?.length ?? 0) > 0 && (
                  <TikTokIcon size={14} />
                )}
                {(creator.youtubeHandles?.length ?? 0) > 0 && (
                  <Youtube size={14} />
                )}
              </div>
            )}
            {/* View count */}
            {creator.portfolioViewCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-warm-gray-400">
                <Eye size={13} />
                <span className="font-medium">
                  {creator.portfolioViewCount >= 1000
                    ? `${(creator.portfolioViewCount / 1000).toFixed(1)}k`
                    : creator.portfolioViewCount}
                </span>
              </div>
            )}
          </div>

          {/* Visit link */}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm-gray-500 group-hover:text-coral transition-colors duration-300">
            View Portfolio
            <ArrowUpRight
              size={13}
              className="opacity-0 -translate-x-1 translate-y-0.5 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300"
            />
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

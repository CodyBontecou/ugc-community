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
        className="relative bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(26,22,20,0.04)] hover:shadow-[0_20px_50px_rgba(26,22,20,0.1)] transition-shadow duration-500"
        whileHover={{ y: -6 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top accent line — gradient bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-coral via-rose to-lavender-soft opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Featured / Boosted badge */}
        {creator.isBoosted && (
          <div className="absolute top-5 right-4 z-10 flex items-center gap-1.5 py-1 px-3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full text-[10px] font-bold text-white uppercase tracking-widest shadow-md">
            <Sparkles size={10} />
            Featured
          </div>
        )}

        {/* Main card body */}
        <div className="px-6 pt-6 pb-2">
          {/* Avatar + Identity row */}
          <div className="flex items-start gap-4">
            {/* Avatar with decorative ring */}
            <div className="relative shrink-0">
              <div className="w-[68px] h-[68px] rounded-full p-[2.5px] bg-gradient-to-br from-coral/40 via-rose/30 to-lavender-soft/40 group-hover:from-coral group-hover:via-rose group-hover:to-lavender-soft transition-all duration-500">
                {creator.image ? (
                  <img
                    src={creator.image}
                    alt={name}
                    className="w-full h-full rounded-full object-cover border-[2.5px] border-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-peach-200 to-peach-300 border-[2.5px] border-white flex items-center justify-center text-coral-dark text-xl font-semibold">
                    {name.charAt(0)}
                  </div>
                )}
              </div>
              {/* Available indicator with pulse */}
              {creator.availableForHire && (
                <div className="absolute -bottom-0.5 -right-0.5">
                  <span className="absolute inline-flex h-4 w-4 rounded-full bg-emerald-400/40 animate-ping" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-400 border-[2.5px] border-white" />
                </div>
              )}
            </div>

            {/* Name + Tagline + Location */}
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-[family-name:var(--font-display)] text-[1.25rem] text-warm-gray-900 truncate leading-tight tracking-[-0.01em]">
                  {name}
                </h3>
                {creator.isVerified && (
                  <BadgeCheck
                    size={17}
                    className="text-sky shrink-0 drop-shadow-sm"
                  />
                )}
              </div>

              {creator.tagline && (
                <p className="text-[13px] text-warm-gray-500 line-clamp-1 mt-1 leading-snug">
                  {creator.tagline}
                </p>
              )}

              {hasLocation && (
                <div className="flex items-center gap-1 mt-1.5 text-[11px] text-warm-gray-400 font-medium uppercase tracking-wide">
                  <MapPin size={10} strokeWidth={2.5} />
                  <span className="truncate">{locationText}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Niches */}
        {niches.length > 0 && (
          <div className="px-6 pt-3 flex flex-wrap gap-1.5">
            {niches.map((niche) => (
              <span
                key={niche}
                className="py-[3px] px-3 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-warm-gray-50 text-warm-gray-500 border border-warm-gray-100 group-hover:bg-peach-100 group-hover:text-coral-dark group-hover:border-peach-200 transition-colors duration-300"
              >
                {NICHE_LABELS[niche] || niche}
              </span>
            ))}
          </div>
        )}

        {/* Footer bar */}
        <div className="mt-4 mx-4 mb-4 px-4 py-3 bg-warm-gray-50/60 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Social icons */}
            {hasSocials && (
              <div className="flex items-center gap-2.5 text-warm-gray-300 group-hover:text-warm-gray-500 transition-colors duration-300">
                {(creator.instagramHandles?.length ?? 0) > 0 && (
                  <Instagram size={14} strokeWidth={1.8} />
                )}
                {(creator.tiktokHandles?.length ?? 0) > 0 && (
                  <TikTokIcon size={14} />
                )}
                {(creator.youtubeHandles?.length ?? 0) > 0 && (
                  <Youtube size={14} strokeWidth={1.8} />
                )}
              </div>
            )}

            {/* Divider */}
            {hasSocials && creator.portfolioViewCount > 0 && (
              <div className="w-px h-3.5 bg-warm-gray-200" />
            )}

            {/* View count */}
            {creator.portfolioViewCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-warm-gray-400 font-medium tabular-nums">
                <Eye size={12} strokeWidth={2} />
                <span>
                  {creator.portfolioViewCount >= 1000
                    ? `${(creator.portfolioViewCount / 1000).toFixed(1)}k`
                    : creator.portfolioViewCount}
                </span>
              </div>
            )}
          </div>

          {/* Visit link — arrow CTA */}
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-warm-gray-400 group-hover:text-coral transition-colors duration-300 tracking-wide uppercase">
            Portfolio
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-warm-gray-100 group-hover:bg-coral group-hover:border-coral transition-all duration-300 shadow-sm">
              <ArrowUpRight
                size={12}
                strokeWidth={2.5}
                className="text-warm-gray-400 group-hover:text-white transition-colors duration-300"
              />
            </span>
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

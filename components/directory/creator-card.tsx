"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  MapPin,
  ExternalLink,
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
        className="relative bg-white rounded-[--radius-xl] border border-warm-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Featured / Boosted badge */}
        {creator.isBoosted && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 py-1 px-2.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
            <Sparkles size={10} />
            Featured
          </div>
        )}

        {/* Avatar + Identity */}
        <div className="p-5 pb-0">
          <div className="flex items-start gap-3.5">
            {/* Avatar */}
            <div className="relative shrink-0">
              {creator.image ? (
                <img
                  src={creator.image}
                  alt={name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white text-lg font-semibold shadow-md">
                  {name.charAt(0)}
                </div>
              )}
              {/* Available indicator */}
              {creator.availableForHire && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full" />
              )}
            </div>

            {/* Name + Tagline */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-[family-name:var(--font-display)] text-lg text-warm-gray-900 truncate leading-tight">
                  {name}
                </h3>
                {creator.isVerified && (
                  <BadgeCheck
                    size={16}
                    className="text-sky shrink-0"
                  />
                )}
              </div>

              {creator.tagline && (
                <p className="text-sm text-warm-gray-500 line-clamp-1 mt-0.5">
                  {creator.tagline}
                </p>
              )}

              {hasLocation && (
                <div className="flex items-center gap-1 mt-1 text-xs text-warm-gray-400">
                  <MapPin size={11} />
                  <span className="truncate">{locationText}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Niches */}
        {niches.length > 0 && (
          <div className="px-5 pt-3 flex flex-wrap gap-1.5">
            {niches.map((niche) => (
              <span
                key={niche}
                className="py-0.5 px-2.5 rounded-full text-[11px] font-medium bg-peach-100 text-coral-dark border border-peach-200"
              >
                {NICHE_LABELS[niche] || niche}
              </span>
            ))}
          </div>
        )}

        {/* Footer bar */}
        <div className="mt-4 px-5 py-3 bg-warm-gray-50/80 border-t border-warm-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Social icons */}
            {hasSocials && (
              <div className="flex items-center gap-2 text-warm-gray-400">
                {(creator.instagramHandles?.length ?? 0) > 0 && (
                  <Instagram size={13} />
                )}
                {(creator.tiktokHandles?.length ?? 0) > 0 && (
                  <TikTokIcon size={13} />
                )}
                {(creator.youtubeHandles?.length ?? 0) > 0 && (
                  <Youtube size={13} />
                )}
              </div>
            )}
            {/* View count */}
            {creator.portfolioViewCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-warm-gray-400">
                <Eye size={12} />
                <span>
                  {creator.portfolioViewCount >= 1000
                    ? `${(creator.portfolioViewCount / 1000).toFixed(1)}k`
                    : creator.portfolioViewCount}
                </span>
              </div>
            )}
          </div>

          {/* Visit link */}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-coral group-hover:text-coral-dark transition-colors">
            View Portfolio
            <ExternalLink
              size={11}
              className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
            />
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

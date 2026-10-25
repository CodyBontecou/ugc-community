"use client";

import { AvatarImage } from "@/components/avatar-image";
import { motion } from "framer-motion";
import Link from "next/link";
import { BrandLink } from "@/components/brand-link";
import {
  ArrowLeft,
  MapPin,
  ExternalLink,
  BadgeCheck,
  Sparkles,
  Eye,
  Instagram,
  Youtube,
  Globe,
} from "lucide-react";
import { NICHE_LABELS, RATE_RANGE_LABELS, type Niche, type RateRange } from "@/lib/directory/constants";
import type { DirectoryCreator } from "@/lib/directory/queries";

// TikTok icon
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.72a8.16 8.16 0 004.76 1.52V6.79a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}

interface CreatorProfileProps {
  creator: DirectoryCreator;
}

export function CreatorProfile({ creator }: CreatorProfileProps) {
  const name = creator.displayName || creator.name;
  const niches = (creator.niches || []) as Niche[];
  const hasLocation = creator.locationCity || creator.locationCountry;
  const locationText = [creator.locationCity, creator.locationCountry]
    .filter(Boolean)
    .join(", ");

  const portfolioUrl = `https://${creator.subdomain}.ugc.community`;

  return (
    <div className="min-h-screen bg-cream">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-warm-gray-100">
        <div className="container flex items-center justify-between h-16">
          <Link
            href="/creators"
            aria-label="Back to Directory"
            className="inline-flex items-center gap-2 text-sm font-medium text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Directory</span>
          </Link>
          <BrandLink className="hover:text-coral transition-colors" />
          <div className="hidden sm:block w-[140px]" /> {/* Spacer for centering */}
        </div>
      </nav>

      {/* Profile Header */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-peach-100 via-peach-200/30 to-cream" />
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-gradient-to-bl from-rose/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-gradient-to-tr from-lavender/8 to-transparent rounded-full blur-3xl" />

        <div className="container relative py-12 sm:py-16">
          <motion.div
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                {creator.image ? (
                  <AvatarImage size={112}
                    src={creator.image}
                    alt={name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white text-3xl font-semibold shadow-lg border-4 border-white">
                    {name.charAt(0)}
                  </div>
                )}
                {creator.availableForHire && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 border-3 border-white rounded-full shadow-sm" />
                )}
              </div>

              {/* Info */}
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-2">
                  <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] leading-tight tracking-[-0.01em]">
                    {name}
                  </h1>
                  {creator.isVerified && (
                    <BadgeCheck size={22} className="text-sky shrink-0" />
                  )}
                  {creator.isBoosted && (
                    <span className="inline-flex items-center gap-1 py-0.5 px-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                      <Sparkles size={10} />
                      Featured
                    </span>
                  )}
                </div>

                {creator.tagline && (
                  <p className="text-lg text-warm-gray-600 leading-relaxed mb-3">
                    {creator.tagline}
                  </p>
                )}

                {creator.bio && !creator.tagline && (
                  <p className="text-base text-warm-gray-500 leading-relaxed mb-3 line-clamp-3">
                    {creator.bio}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start text-sm text-warm-gray-500">
                  {hasLocation && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} className="text-warm-gray-400" />
                      {locationText}
                    </span>
                  )}
                  {creator.rateRange && (
                    <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-warm-gray-100 text-xs font-medium text-warm-gray-600">
                      {RATE_RANGE_LABELS[creator.rateRange as RateRange] || creator.rateRange}
                    </span>
                  )}
                  {creator.availableForHire && (
                    <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-emerald-50 text-xs font-medium text-emerald-700">
                      ✓ Available for Hire
                    </span>
                  )}
                  {creator.portfolioViewCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Eye size={14} className="text-warm-gray-400" />
                      {creator.portfolioViewCount.toLocaleString()} views
                    </span>
                  )}
                </div>

                {/* Niches */}
                {niches.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                    {niches.map((niche) => (
                      <Link
                        key={niche}
                        href={`/creators?niche=${niche}`}
                        className="py-1 px-3 rounded-full text-xs font-medium bg-peach-100 text-coral-dark border border-peach-200 hover:bg-peach-200 transition-colors"
                      >
                        {NICHE_LABELS[niche] || niche}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Social handles */}
                <div className="flex flex-wrap items-center gap-3 mt-5 justify-center sm:justify-start">
                  {(creator.instagramHandles?.length ?? 0) > 0 &&
                    creator.instagramHandles!.map((handle) => (
                      <a
                        key={handle}
                        href={`https://instagram.com/${handle.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white border border-warm-gray-200 text-xs font-medium text-warm-gray-600 hover:border-rose hover:text-rose transition-colors"
                      >
                        <Instagram size={13} />
                        @{handle.replace("@", "")}
                      </a>
                    ))}
                  {(creator.tiktokHandles?.length ?? 0) > 0 &&
                    creator.tiktokHandles!.map((handle) => (
                      <a
                        key={handle}
                        href={`https://tiktok.com/@${handle.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white border border-warm-gray-200 text-xs font-medium text-warm-gray-600 hover:border-warm-gray-900 hover:text-warm-gray-900 transition-colors"
                      >
                        <TikTokIcon size={13} />
                        @{handle.replace("@", "")}
                      </a>
                    ))}
                  {(creator.youtubeHandles?.length ?? 0) > 0 &&
                    creator.youtubeHandles!.map((handle) => (
                      <a
                        key={handle}
                        href={`https://youtube.com/@${handle.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white border border-warm-gray-200 text-xs font-medium text-warm-gray-600 hover:border-red-500 hover:text-red-500 transition-colors"
                      >
                        <Youtube size={13} />
                        @{handle.replace("@", "")}
                      </a>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Portfolio Embed */}
      <section className="container pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Browser chrome */}
          <div className="bg-white rounded-[--radius-xl] shadow-xl overflow-hidden border border-warm-gray-200">
            <div className="flex items-center gap-4 py-3 px-5 bg-warm-gray-50 border-b border-warm-gray-100">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
              </div>
              <div className="flex-1 flex items-center gap-2 py-1.5 px-4 bg-white rounded-[--radius-sm] text-xs text-warm-gray-500 border border-warm-gray-200">
                <Globe size={12} />
                <span>{creator.subdomain}.ugc.community</span>
              </div>
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-warm-gray-500 hover:text-coral transition-colors"
              >
                Open
                <ExternalLink size={11} />
              </a>
            </div>

            {/* Iframe */}
            <iframe
              src={portfolioUrl}
              title={`${name}'s Portfolio`}
              className="w-full h-[70vh] min-h-[500px] border-0"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>

          {/* CTA below embed */}
          <div className="text-center mt-8">
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 py-3 px-8 rounded-full text-sm font-medium bg-gradient-to-r from-coral to-rose text-white hover:opacity-90 transition-opacity shadow-md"
            >
              Visit Full Portfolio
              <ExternalLink size={14} />
            </a>
          </div>
        </motion.div>
      </section>

    </div>
  );
}

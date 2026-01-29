"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, User } from "lucide-react";
import { NicheBadges } from "./niche-badges";
import { VerifiedBadge } from "./verified-badge";
import { RATE_RANGE_LABELS, type RateRange } from "@/lib/directory/constants";

interface CreatorCardProps {
  subdomain: string;
  displayName: string | null;
  name: string;
  image: string | null;
  tagline: string | null;
  niches: string[] | null;
  locationCity: string | null;
  locationCountry: string | null;
  rateRange: string | null;
  availableForHire: boolean;
  isFeatured: boolean;
  isVerified: boolean;
}

export function CreatorCard({
  subdomain,
  displayName,
  name,
  image,
  tagline,
  niches,
  locationCity,
  locationCountry,
  rateRange,
  availableForHire,
  isFeatured,
  isVerified,
}: CreatorCardProps) {
  const [imageError, setImageError] = useState(false);
  const displayNameFinal = displayName || name;
  const location = [locationCity, locationCountry].filter(Boolean).join(", ");

  return (
    <Link
      href={`/creators/${subdomain}`}
      className="group block bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden hover:border-warm-gray-300 hover:shadow-lg transition-all duration-200"
    >
      {/* Header with image */}
      <div className="relative aspect-[4/3] bg-warm-gray-100">
        {image && !imageError ? (
          <img
            src={image}
            alt={displayNameFinal}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-lavender-soft to-coral/20">
            <User size={48} className="text-warm-gray-400" />
          </div>
        )}

        {/* Featured/Verified badges overlay */}
        {(isFeatured || isVerified) && (
          <div className="absolute top-3 right-3">
            <VerifiedBadge isFeatured={isFeatured} isVerified={isVerified} />
          </div>
        )}

        {/* Available badge */}
        {availableForHire && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-mint/90 text-white">
              Available
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name and badges */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-warm-gray-900 group-hover:text-lavender transition-colors truncate">
            {displayNameFinal}
          </h3>
        </div>

        {/* Tagline */}
        {tagline && (
          <p className="text-sm text-warm-gray-600 mb-3 line-clamp-2">
            {tagline}
          </p>
        )}

        {/* Niches */}
        <div className="mb-3">
          <NicheBadges niches={niches} max={3} />
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-warm-gray-500">
          {/* Location */}
          {location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin size={12} />
              {location}
            </span>
          )}

          {/* Rate range */}
          {rateRange && (
            <span className="text-warm-gray-600 font-medium">
              {RATE_RANGE_LABELS[rateRange as RateRange]}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { User, MapPin, ExternalLink, X, Loader2 } from "lucide-react";
import { NicheBadges } from "@/components/directory/niche-badges";

interface SavedCreatorCardProps {
  creatorId: string;
  name: string;
  displayName: string | null;
  image: string | null;
  subdomain: string | null;
  tagline: string | null;
  niches: string[] | null;
  locationCity: string | null;
  locationCountry: string | null;
  availableForHire: boolean;
  savedAt: Date;
  onRemove: (creatorId: string) => Promise<void>;
}

export function SavedCreatorCard({
  creatorId,
  name,
  displayName,
  image,
  subdomain,
  tagline,
  niches,
  locationCity,
  locationCountry,
  availableForHire,
  savedAt,
  onRemove,
}: SavedCreatorCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const displayNameFinal = displayName || name;
  const location = [locationCity, locationCountry].filter(Boolean).join(", ");
  const savedDate = new Date(savedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRemoving(true);
    try {
      await onRemove(creatorId);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden hover:border-warm-gray-300 hover:shadow-sm transition-all">
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

        {/* Remove button */}
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-warm-gray-500 hover:text-coral transition-colors shadow-sm disabled:opacity-50"
          aria-label="Remove from saved"
        >
          {isRemoving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <X size={16} />
          )}
        </button>

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
        {/* Name */}
        <h3 className="font-semibold text-warm-gray-900 mb-1 truncate">
          {displayNameFinal}
        </h3>

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
        <div className="flex items-center justify-between text-xs text-warm-gray-500 mb-4">
          {location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin size={12} />
              {location}
            </span>
          )}
          <span>Saved {savedDate}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {subdomain && (
            <>
              <Link
                href={`/creators/${subdomain}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-warm-gray-700 bg-warm-gray-100 hover:bg-warm-gray-200 rounded-[--radius-md] transition-colors"
              >
                View Profile
              </Link>
              <a
                href={`https://${subdomain}.ugc.community`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-coral to-rose hover:opacity-90 rounded-[--radius-md] transition-opacity"
              >
                <ExternalLink size={14} />
                Portfolio
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

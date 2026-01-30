"use client";

import { CreatorCard } from "./creator-card";
import { CreatorCardSkeleton } from "./creator-card-skeleton";
import type { DirectoryCreator } from "@/lib/directory/queries";

interface CreatorGridProps {
  creators: DirectoryCreator[];
  loading?: boolean;
}

export function CreatorGrid({ creators, loading }: CreatorGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <CreatorCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (creators.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-warm-gray-500 text-lg">
          No creators found matching your filters.
        </p>
        <p className="text-warm-gray-400 mt-2">
          Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {creators.map((creator) => (
        <CreatorCard
          key={creator.id}
          subdomain={creator.subdomain}
          displayName={creator.displayName}
          name={creator.name}
          image={creator.image}
          tagline={creator.tagline}
          niches={creator.niches}
          locationCity={creator.locationCity}
          locationCountry={creator.locationCountry}
          rateRange={creator.rateRange}
          availableForHire={creator.availableForHire}
          isFeatured={creator.isFeatured}
          isVerified={creator.isVerified}
          isBoosted={creator.isBoosted}
        />
      ))}
    </div>
  );
}

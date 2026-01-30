"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Loader2, Heart } from "lucide-react";
import { SavedCreatorCard } from "@/components/dashboard/saved-creator-card";
import { useBrandUser } from "@/lib/hooks/use-brand-user";

interface SavedCreator {
  id: string;
  creatorId: string;
  savedAt: string;
  creator: {
    id: string;
    name: string;
    displayName: string | null;
    image: string | null;
    subdomain: string | null;
    tagline: string | null;
    niches: string[] | null;
    locationCity: string | null;
    locationCountry: string | null;
    availableForHire: boolean;
    isVerified: boolean;
    isFeatured: boolean;
  };
}

export default function SavedCreatorsPage() {
  const { isBrand, isLoading: isBrandLoading } = useBrandUser();
  const [savedCreators, setSavedCreators] = useState<SavedCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedCreators = useCallback(async () => {
    try {
      const response = await fetch("/api/brands/saved-creators");
      if (response.ok) {
        const data = await response.json();
        setSavedCreators(data.savedCreators || []);
      } else if (response.status === 403) {
        setError("Only brand accounts can access saved creators");
      } else {
        setError("Failed to load saved creators");
      }
    } catch (err) {
      console.error("Error fetching saved creators:", err);
      setError("Failed to load saved creators");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isBrandLoading) {
      fetchSavedCreators();
    }
  }, [isBrandLoading, fetchSavedCreators]);

  const handleRemove = async (creatorId: string) => {
    try {
      const response = await fetch(`/api/brands/saved-creators/${creatorId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSavedCreators((prev) =>
          prev.filter((sc) => sc.creatorId !== creatorId)
        );
      }
    } catch (err) {
      console.error("Error removing saved creator:", err);
    }
  };

  // Loading state
  if (isBrandLoading || isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  // Error or not a brand
  if (error || !isBrand) {
    return (
      <div className="max-w-6xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-warm-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-warm-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-warm-gray-900 mb-2">
            {error || "Brand Account Required"}
          </h2>
          <p className="text-warm-gray-500 mb-6">
            {error
              ? "Please try again later."
              : "This feature is only available for brand accounts."}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-coral to-rose text-white font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          Saved Creators
        </h1>
        <p className="text-warm-gray-500">
          Creators you've saved for future collaboration
        </p>
      </div>

      {/* Empty state */}
      {savedCreators.length === 0 && (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-coral/10 to-rose/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-coral" />
          </div>
          <h2 className="text-lg font-semibold text-warm-gray-900 mb-2">
            No saved creators yet
          </h2>
          <p className="text-warm-gray-500 mb-6 max-w-md mx-auto">
            Browse the creator directory and click the heart icon to save
            creators you're interested in working with.
          </p>
          <Link
            href="/creators"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-coral to-rose text-white font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            <Users size={18} />
            Browse Creators
          </Link>
        </div>
      )}

      {/* Creator grid */}
      {savedCreators.length > 0 && (
        <>
          <p className="text-sm text-warm-gray-500 mb-6">
            {savedCreators.length} saved creator
            {savedCreators.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCreators.map((saved) => (
              <SavedCreatorCard
                key={saved.id}
                creatorId={saved.creatorId}
                name={saved.creator.name}
                displayName={saved.creator.displayName}
                image={saved.creator.image}
                subdomain={saved.creator.subdomain}
                tagline={saved.creator.tagline}
                niches={saved.creator.niches}
                locationCity={saved.creator.locationCity}
                locationCountry={saved.creator.locationCountry}
                availableForHire={saved.creator.availableForHire}
                savedAt={new Date(saved.savedAt)}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

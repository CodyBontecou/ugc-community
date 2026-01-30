"use client";

import { useState, useEffect, useCallback } from "react";

interface UseSavedCreatorsResult {
  savedIds: Set<string>;
  isLoading: boolean;
  isSaving: Set<string>;
  toggleSave: (creatorId: string) => Promise<void>;
  isSaved: (creatorId: string) => boolean;
}

export function useSavedCreators(): UseSavedCreatorsResult {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Set<string>>(new Set());

  // Fetch saved creator IDs on mount
  useEffect(() => {
    async function fetchSavedIds() {
      try {
        const response = await fetch("/api/brands/saved-creators?ids_only=true");
        if (response.ok) {
          const data = await response.json();
          setSavedIds(new Set(data.creatorIds || []));
        }
      } catch (error) {
        console.error("Failed to fetch saved creators:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSavedIds();
  }, []);

  const toggleSave = useCallback(async (creatorId: string) => {
    // Mark as saving
    setIsSaving((prev) => new Set(prev).add(creatorId));

    const wasSaved = savedIds.has(creatorId);

    // Optimistic update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) {
        next.delete(creatorId);
      } else {
        next.add(creatorId);
      }
      return next;
    });

    try {
      if (wasSaved) {
        // Unsave
        const response = await fetch(`/api/brands/saved-creators/${creatorId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to unsave");
        }
      } else {
        // Save
        const response = await fetch("/api/brands/saved-creators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorId }),
        });
        if (!response.ok) {
          throw new Error("Failed to save");
        }
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      // Revert optimistic update on error
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) {
          next.add(creatorId);
        } else {
          next.delete(creatorId);
        }
        return next;
      });
    } finally {
      setIsSaving((prev) => {
        const next = new Set(prev);
        next.delete(creatorId);
        return next;
      });
    }
  }, [savedIds]);

  const isSaved = useCallback(
    (creatorId: string) => savedIds.has(creatorId),
    [savedIds]
  );

  return {
    savedIds,
    isLoading,
    isSaving,
    toggleSave,
    isSaved,
  };
}

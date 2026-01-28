"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  portfolioId: string;
}

export function ViewTracker({ portfolioId }: ViewTrackerProps) {
  useEffect(() => {
    // Fire-and-forget view tracking
    fetch(`/api/portfolio/${portfolioId}/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch(() => {
      // Silently fail - view tracking shouldn't break the page
    });
  }, [portfolioId]);

  // This component renders nothing
  return null;
}

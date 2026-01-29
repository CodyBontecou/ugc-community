"use client";

import { useEffect, useRef } from "react";

interface ViewTrackerProps {
  portfolioId: string;
}

export function ViewTracker({ portfolioId }: ViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent double tracking in strict mode
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Fire-and-forget: track the view without blocking
    const trackView = async () => {
      try {
        // Try sendBeacon first for better reliability on page unload
        const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/portfolio/${portfolioId}/view`;

        if (navigator.sendBeacon) {
          navigator.sendBeacon(apiUrl);
        } else {
          // Fallback to fetch (fire-and-forget)
          fetch(apiUrl, {
            method: "POST",
            keepalive: true,
          }).catch(() => {
            // Silently fail
          });
        }
      } catch {
        // Silently fail - tracking should never break the page
      }
    };

    trackView();
  }, [portfolioId]);

  // This component renders nothing
  return null;
}

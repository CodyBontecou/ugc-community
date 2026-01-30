"use client";

import { useMilestoneCelebrations } from "@/lib/hooks/useMilestoneCelebrations";

/**
 * Component that checks for new milestone celebrations on mount.
 * Renders nothing - just runs the hook.
 */
export function MilestoneCelebrationChecker() {
  useMilestoneCelebrations();
  return null;
}

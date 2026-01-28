"use client";

import { useEffect } from "react";

/**
 * Hook to handle pending invite tokens stored in sessionStorage.
 * Used after OAuth sign-up to mark the invite as used.
 */
export function usePendingInvite() {
  useEffect(() => {
    const pendingToken = sessionStorage.getItem("pendingInviteToken");

    if (pendingToken) {
      // Remove immediately to prevent duplicate calls
      sessionStorage.removeItem("pendingInviteToken");

      // Mark the invite as used
      fetch("/api/invites/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: pendingToken }),
      }).catch((error) => {
        console.error("Failed to mark invite as used:", error);
      });
    }
  }, []);
}

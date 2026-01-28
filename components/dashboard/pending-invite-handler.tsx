"use client";

import { usePendingInvite } from "@/lib/hooks/use-pending-invite";

/**
 * Client component that handles pending invite tokens from OAuth sign-ups.
 * Should be placed in the dashboard layout to run after successful auth.
 */
export function PendingInviteHandler() {
  usePendingInvite();
  return null;
}

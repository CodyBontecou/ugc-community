"use client";

import { BehaviorAnalytics } from "./behavior-analytics";

// Keep the existing layout entry point while consolidating referral and product tracking.
export default function AIReferralTracker() {
  return <BehaviorAnalytics />;
}

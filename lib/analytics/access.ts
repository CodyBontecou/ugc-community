/**
 * Analytics Access Control
 *
 * Gates advanced analytics features behind milestone rewards.
 */

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type AnalyticsFeatures = {
  basicStats: boolean;
  engagementTrends: boolean;
  platformComparison: boolean;
  dataExport: boolean;
  detailedPostMetrics: boolean;
};

/**
 * Check if a user has access to advanced analytics features
 */
export async function canAccessAdvancedAnalytics(
  userId: string
): Promise<boolean> {
  const [user] = await db
    .select({ hasAdvancedAnalytics: users.hasAdvancedAnalytics })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.hasAdvancedAnalytics ?? false;
}

/**
 * Get the analytics features available to a user
 *
 * Features gated behind hasAdvancedAnalytics:
 * - Engagement trends over time (chart)
 * - Platform comparison breakdown
 * - CSV/JSON export of analytics data
 * - Detailed per-post performance metrics
 */
export async function getAnalyticsFeatures(
  userId: string
): Promise<AnalyticsFeatures> {
  const hasAdvanced = await canAccessAdvancedAnalytics(userId);

  return {
    // Basic stats always available
    basicStats: true,
    // Advanced features require hasAdvancedAnalytics reward
    engagementTrends: hasAdvanced,
    platformComparison: hasAdvanced,
    dataExport: hasAdvanced,
    detailedPostMetrics: hasAdvanced,
  };
}

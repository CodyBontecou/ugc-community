/**
 * Shared types for analytics and reward-gated features
 */

export type AnalyticsFeatures = {
  basicStats: boolean;
  engagementTrends: boolean;
  platformComparison: boolean;
  dataExport: boolean;
  detailedPostMetrics: boolean;
};

export type ContactSubmissions = {
  total: number;
  last30Days: number;
  last7Days: number;
};

export type Stats = {
  profileViewCount: number;
  portfolioViewCount: number;
  hasSubdomain: boolean;
  contactSubmissions: ContactSubmissions;
  analyticsFeatures: AnalyticsFeatures;
};

export type PortfolioStatus = {
  isActive: boolean;
  reason: "hosting_reward" | "posting_requirement_met" | "requirement_not_met";
  hasHostingReward: boolean;
  hostingRewardExpiry: string | null;
  monthlyPostCount: number;
  requiredPostCount: number;
};

export type ActiveReward = {
  type: string;
  name: string;
  description: string;
  earnedAt: string;
  expiresAt: string | null;
  isPermanent: boolean;
  milestoneName: string;
  daysRemaining: number | null;
};

// Feature unlock requirements for display
export const FEATURE_REQUIREMENTS: Record<
  keyof Omit<AnalyticsFeatures, "basicStats">,
  { threshold: number; label: string }
> = {
  engagementTrends: { threshold: 100, label: "Reach 100 lifetime posts" },
  platformComparison: { threshold: 100, label: "Reach 100 lifetime posts" },
  dataExport: { threshold: 100, label: "Reach 100 lifetime posts" },
  detailedPostMetrics: { threshold: 100, label: "Reach 100 lifetime posts" },
};

"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Lock,
  PieChart,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";
import type { Stats } from "@/lib/types/analytics";
import { FEATURE_REQUIREMENTS } from "@/lib/types/analytics";
import { FeatureGate, LockedButton } from "@/components/ui/feature-gate";

// Types for the analytics API response
type ViewTrend = {
  week: string;
  profileViews: number;
  portfolioViews: number;
};

type AnalyticsData = {
  viewTrends: ViewTrend[];
  platformBreakdown: Record<string, number>;
  topPosts: Array<{
    id: string;
    platform: string;
    postUrl: string | null;
    postedAt: Date | null;
    metadata: Record<string, unknown> | null;
  }>;
  totals: {
    profileViewCount: number;
    portfolioViewCount: number;
    lifetimePostCount: number;
  };
};

// Platform color mapping
const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-500",
  tiktok: "bg-gray-800",
  youtube: "bg-red-500",
  twitter: "bg-blue-400",
  facebook: "bg-blue-600",
  linkedin: "bg-blue-700",
  other: "bg-warm-gray-500",
};

// Simple SVG bar chart component
function EngagementChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);

  return (
    <div className="h-32 flex items-end gap-1">
      {data.map((value, index) => (
        <div
          key={index}
          className="flex-1 bg-gradient-to-t from-coral to-rose rounded-t transition-all duration-300"
          style={{ height: `${(value / max) * 100}%`, minHeight: "4px" }}
          title={`${value} views`}
        />
      ))}
    </div>
  );
}

// Platform breakdown component with real data
function PlatformBreakdown({
  data,
}: {
  data: Array<{ name: string; percentage: number; color: string }>;
}) {
  if (data.length === 0) {
    return (
      <div className="text-center py-4 text-warm-gray-500 text-sm">
        No platform data available yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((platform) => (
        <div key={platform.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-warm-gray-700 capitalize">
              {platform.name}
            </span>
            <span className="text-warm-gray-500">{platform.percentage}%</span>
          </div>
          <div className="h-2 bg-warm-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${platform.color} rounded-full transition-all duration-500`}
              style={{ width: `${platform.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdvancedAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats for feature access check
        const statsResponse = await fetch("/api/user/stats");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);

          // Only fetch analytics if user has advanced analytics access
          if (statsData.analyticsFeatures?.engagementTrends) {
            const analyticsResponse = await fetch("/api/user/analytics");
            if (analyticsResponse.ok) {
              const analyticsData = await analyticsResponse.json();
              setAnalytics(analyticsData);
            } else if (analyticsResponse.status === 403) {
              // User doesn't have access - this is expected
            } else {
              setError("Failed to load analytics data");
            }
          }
        }
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-warm-gray-200 rounded w-1/3" />
          <div className="h-32 bg-warm-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 p-6">
        <div className="text-center text-warm-gray-500 text-sm">{error}</div>
      </div>
    );
  }

  if (!stats || !stats.hasSubdomain) {
    return null;
  }

  const features = stats.analyticsFeatures;
  const hasAdvanced = features?.engagementTrends ?? false;

  // Convert viewTrends to chart data (combined profile + portfolio views per week)
  const engagementData =
    analytics?.viewTrends.map(
      (trend) => trend.profileViews + trend.portfolioViews
    ) ?? [];

  // Convert platformBreakdown to display format
  const platformData = (() => {
    if (!analytics?.platformBreakdown) return [];
    const breakdown = analytics.platformBreakdown;
    const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
    if (total === 0) return [];

    return Object.entries(breakdown)
      .map(([name, count]) => ({
        name: name.toLowerCase(),
        percentage: Math.round((count / total) * 100),
        color: PLATFORM_COLORS[name.toLowerCase()] || PLATFORM_COLORS.other,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  })();

  const hasEnoughData = engagementData.length > 0;

  const handleExport = async (format: "csv" | "json") => {
    try {
      const response = await fetch(`/api/user/analytics/export?format=${format}`);
      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get the filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `analytics-export.${format}`;

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-lg font-semibold text-warm-gray-900 flex items-center gap-2">
          <BarChart3 size={20} className="text-coral" />
          Advanced Analytics
        </h2>
        {!hasAdvanced && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-warm-gray-100 text-warm-gray-500">
            <Lock size={12} />
            {FEATURE_REQUIREMENTS.engagementTrends.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trends */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-coral" />
            <h3 className="font-medium text-warm-gray-900">Engagement Trends</h3>
          </div>
          <FeatureGate
            unlocked={hasAdvanced}
            unlockRequirement={FEATURE_REQUIREMENTS.engagementTrends.label}
            showTeaser={true}
          >
            <div className="bg-warm-gray-50 rounded-lg p-4 border border-warm-gray-100">
              {hasEnoughData ? (
                <>
                  <EngagementChart data={engagementData} />
                  <div className="flex justify-between text-xs text-warm-gray-500 mt-2">
                    <span>{engagementData.length} weeks ago</span>
                    <span>This week</span>
                  </div>
                </>
              ) : (
                <div className="h-32 flex items-center justify-center text-warm-gray-500 text-sm">
                  Not enough data yet
                </div>
              )}
            </div>
          </FeatureGate>
        </div>

        {/* Platform Comparison */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PieChart size={16} className="text-rose" />
            <h3 className="font-medium text-warm-gray-900">Platform Breakdown</h3>
          </div>
          <FeatureGate
            unlocked={hasAdvanced}
            unlockRequirement={FEATURE_REQUIREMENTS.platformComparison.label}
            showTeaser={true}
          >
            <div className="bg-warm-gray-50 rounded-lg p-4 border border-warm-gray-100">
              <PlatformBreakdown data={platformData} />
            </div>
          </FeatureGate>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="mt-6 pt-6 border-t border-warm-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Download size={16} className="text-warm-gray-500" />
          <h3 className="font-medium text-warm-gray-900">Export Data</h3>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {hasAdvanced ? (
            <>
              <button
                onClick={() => handleExport("csv")}
                className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-warm-gray-200 text-warm-gray-700 hover:bg-warm-gray-50 transition-colors"
              >
                <FileSpreadsheet size={16} />
                Export CSV
              </button>
              <button
                onClick={() => handleExport("json")}
                className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-warm-gray-200 text-warm-gray-700 hover:bg-warm-gray-50 transition-colors"
              >
                <FileJson size={16} />
                Export JSON
              </button>
            </>
          ) : (
            <>
              <LockedButton
                unlockRequirement={FEATURE_REQUIREMENTS.dataExport.label}
                className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-warm-gray-200 text-warm-gray-400"
              >
                <FileSpreadsheet size={16} />
                Export CSV
              </LockedButton>
              <LockedButton
                unlockRequirement={FEATURE_REQUIREMENTS.dataExport.label}
                className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-warm-gray-200 text-warm-gray-400"
              >
                <FileJson size={16} />
                Export JSON
              </LockedButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

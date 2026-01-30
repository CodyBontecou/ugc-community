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

// Simple SVG bar chart component
function EngagementChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const barWidth = 100 / data.length;

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

// Simple platform breakdown component
function PlatformBreakdown() {
  // Mock data - in a real implementation this would come from the API
  const platforms = [
    { name: "Instagram", percentage: 45, color: "bg-pink-500" },
    { name: "TikTok", percentage: 35, color: "bg-gray-800" },
    { name: "YouTube", percentage: 20, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-3">
      {platforms.map((platform) => (
        <div key={platform.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-warm-gray-700">{platform.name}</span>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/user/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-warm-gray-200 rounded w-1/3" />
          <div className="h-32 bg-warm-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!stats || !stats.hasSubdomain) {
    return null;
  }

  const features = stats.analyticsFeatures;
  const hasAdvanced = features?.engagementTrends ?? false;

  // Mock engagement data - in real implementation would come from API
  const mockEngagementData = [12, 19, 15, 25, 22, 30, 28, 35, 32, 40, 38, 45];

  const handleExport = (format: "csv" | "json") => {
    // In real implementation, this would trigger a download
    console.log(`Exporting as ${format}`);
  };

  return (
    <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-warm-gray-900 flex items-center gap-2">
          <BarChart3 size={20} className="text-lavender" />
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
              <EngagementChart data={mockEngagementData} />
              <div className="flex justify-between text-xs text-warm-gray-500 mt-2">
                <span>12 weeks ago</span>
                <span>This week</span>
              </div>
            </div>
          </FeatureGate>
        </div>

        {/* Platform Comparison */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PieChart size={16} className="text-mint" />
            <h3 className="font-medium text-warm-gray-900">Platform Breakdown</h3>
          </div>
          <FeatureGate
            unlocked={hasAdvanced}
            unlockRequirement={FEATURE_REQUIREMENTS.platformComparison.label}
            showTeaser={true}
          >
            <div className="bg-warm-gray-50 rounded-lg p-4 border border-warm-gray-100">
              <PlatformBreakdown />
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
        <div className="flex gap-3">
          {hasAdvanced ? (
            <>
              <button
                onClick={() => handleExport("csv")}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-warm-gray-200 text-warm-gray-700 hover:bg-warm-gray-50 transition-colors"
              >
                <FileSpreadsheet size={16} />
                Export CSV
              </button>
              <button
                onClick={() => handleExport("json")}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-warm-gray-200 text-warm-gray-700 hover:bg-warm-gray-50 transition-colors"
              >
                <FileJson size={16} />
                Export JSON
              </button>
            </>
          ) : (
            <>
              <LockedButton
                unlockRequirement={FEATURE_REQUIREMENTS.dataExport.label}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-warm-gray-200 text-warm-gray-400"
              >
                <FileSpreadsheet size={16} />
                Export CSV
              </LockedButton>
              <LockedButton
                unlockRequirement={FEATURE_REQUIREMENTS.dataExport.label}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-warm-gray-200 text-warm-gray-400"
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

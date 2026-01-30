"use client";

import { useEffect, useState } from "react";
import { Eye, Mail, TrendingUp, Briefcase, Lock, BarChart3 } from "lucide-react";
import type { Stats, AnalyticsFeatures } from "@/lib/types/analytics";
import { FEATURE_REQUIREMENTS } from "@/lib/types/analytics";

export function CreatorStatsCard() {
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
        // Silently fail - stats just won't be shown
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
          <div className="h-6 bg-warm-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-warm-gray-100 rounded-lg" />
            <div className="h-24 bg-warm-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Only show stats card if user has a subdomain (meaning their portfolio is active)
  if (!stats.hasSubdomain) {
    return null;
  }

  return (
    <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
      <h2 className="text-lg font-semibold text-warm-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-coral" />
        Your Stats
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Profile Views */}
        <div className="bg-warm-gray-50 rounded-lg p-4 border border-warm-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lavender-soft/30 flex items-center justify-center">
              <Eye size={20} className="text-lavender" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-gray-900">
                {stats.profileViewCount.toLocaleString()}
              </p>
              <p className="text-sm text-warm-gray-500">Profile Views</p>
            </div>
          </div>
        </div>

        {/* Portfolio Views */}
        <div className="bg-warm-gray-50 rounded-lg p-4 border border-warm-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-mint-soft/30 flex items-center justify-center">
              <Briefcase size={20} className="text-mint" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-gray-900">
                {(stats.portfolioViewCount || 0).toLocaleString()}
              </p>
              <p className="text-sm text-warm-gray-500">Portfolio Views</p>
            </div>
          </div>
        </div>

        {/* Contact Inquiries */}
        <div className="bg-warm-gray-50 rounded-lg p-4 border border-warm-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center">
              <Mail size={20} className="text-coral" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-gray-900">
                {stats.contactSubmissions.total.toLocaleString()}
              </p>
              <p className="text-sm text-warm-gray-500">Total Inquiries</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-warm-gray-200">
            <div>
              <p className="text-lg font-semibold text-warm-gray-800">
                {stats.contactSubmissions.last30Days}
              </p>
              <p className="text-xs text-warm-gray-500">Last 30 days</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-warm-gray-800">
                {stats.contactSubmissions.last7Days}
              </p>
              <p className="text-xs text-warm-gray-500">Last 7 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Preview */}
      {stats.analyticsFeatures && !stats.analyticsFeatures.engagementTrends && (
        <div className="mt-6 pt-6 border-t border-warm-gray-100">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-lavender-soft/10 border border-lavender/20">
            <div className="w-10 h-10 rounded-full bg-lavender-soft/30 flex items-center justify-center flex-shrink-0">
              <BarChart3 size={20} className="text-lavender" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-warm-gray-900">
                  Advanced Analytics
                </h3>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-warm-gray-100 text-warm-gray-500">
                  <Lock size={10} />
                  Locked
                </span>
              </div>
              <p className="text-sm text-warm-gray-600 mb-2">
                Unlock engagement trends, platform comparisons, and data export.
              </p>
              <p className="text-xs text-lavender font-medium">
                {FEATURE_REQUIREMENTS.engagementTrends.label} to unlock
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Eye, Mail, TrendingUp, Briefcase } from "lucide-react";

interface Stats {
  profileViewCount: number;
  portfolioViewCount: number;
  hasSubdomain: boolean;
  contactSubmissions: {
    total: number;
    last30Days: number;
    last7Days: number;
  };
}

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
    </div>
  );
}

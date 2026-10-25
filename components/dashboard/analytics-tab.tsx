"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Download,
  Lock,
  Trophy,
  Loader2,
  Eye,
  Globe,
  Mail,
  Info,
} from "lucide-react";
import type { Stats } from "@/lib/types/analytics";
import { FEATURE_REQUIREMENTS } from "@/lib/types/analytics";
import { CreatorStatsCard } from "./creator-stats-card";
import { AdvancedAnalytics } from "./advanced-analytics";
import { PostMetrics } from "./post-metrics";
import { ContentPostsTable } from "./content-posts-table";
import type { TabId } from "./dashboard-shell";

interface AnalyticsTabProps {
  onNavigate: (tab: TabId) => void;
}

export function AnalyticsTab({ onNavigate }: AnalyticsTabProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/user/stats");
        if (res.ok) setStats(await res.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-warm-gray-400" />
      </div>
    );
  }

  // No subdomain → prompt to set up portfolio first
  if (!stats?.hasSubdomain) {
    return <SetupPrompt onNavigate={onNavigate} />;
  }

  const hasAdvanced = stats.analyticsFeatures?.engagementTrends ?? false;

  // Features are locked → show a single consolidated locked state
  // but still show the basic stats card and recognized posts (always visible)
  if (!hasAdvanced) {
    return (
      <div className="space-y-6">
        <CreatorStatsCard />
        <ContentPostsTable />
        <LockedAnalyticsCard />
      </div>
    );
  }

  // Fully unlocked → show everything
  return (
    <div className="space-y-6">
      <CreatorStatsCard />
      <ContentPostsTable />
      <AdvancedAnalytics />
      <PostMetrics />
    </div>
  );
}

/* ── Setup prompt for users without a portfolio ── */

function SetupPrompt({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center mb-5">
        <BarChart3 size={28} className="text-coral" />
      </div>
      <h2 className="text-xl font-semibold text-warm-gray-900 mb-2">
        Analytics will appear here
      </h2>
      <p className="text-warm-gray-500 max-w-sm mb-6">
        Set up your portfolio first, then we&apos;ll track profile views, inquiries, and engagement automatically.
      </p>
      <button
        onClick={() => onNavigate("portfolio")}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full bg-gradient-to-r from-coral to-rose text-white hover:opacity-90 transition-opacity"
      >
        Set Up Portfolio
      </button>
    </div>
  );
}

/* ── Consolidated locked state ── */

function LockedAnalyticsCard() {
  const features = [
    {
      icon: TrendingUp,
      label: "Engagement Trends",
      description: "Weekly view trends across profile and portfolio",
    },
    {
      icon: PieChart,
      label: "Platform Breakdown",
      description: "See which platforms drive the most content",
    },
    {
      icon: BarChart3,
      label: "Post Performance",
      description: "Detailed metrics for each of your posts",
    },
    {
      icon: Download,
      label: "Data Export",
      description: "Download your analytics as CSV or JSON",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center">
            <Lock size={18} className="text-coral" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-warm-gray-900">
                Advanced Analytics
              </h3>
              <Link
                href="/dashboard/analytics/example"
                className="text-warm-gray-400 hover:text-coral transition-colors"
                title="See an example of Advanced Analytics"
              >
                <Info size={16} />
              </Link>
            </div>
            <p className="text-sm text-warm-gray-500">
              {FEATURE_REQUIREMENTS.engagementTrends.label} to unlock
            </p>
          </div>
        </div>
      </div>

      {/* Feature preview grid */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="flex items-start gap-3 p-3.5 rounded-[var(--radius-lg)] bg-warm-gray-50 border border-warm-gray-100"
            >
              <feature.icon
                size={18}
                className="text-warm-gray-300 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-warm-gray-700">
                  {feature.label}
                </p>
                <p className="text-xs text-warm-gray-400 mt-0.5">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-6 py-4 bg-warm-gray-50 border-t border-warm-gray-100 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-warm-gray-500">
          Keep posting to unlock these features
        </p>
        <Link
          href="#milestone-progress"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-coral hover:text-coral-dark transition-colors"
        >
          <Trophy size={14} />
          View Milestones
        </Link>
      </div>
    </motion.div>
  );
}

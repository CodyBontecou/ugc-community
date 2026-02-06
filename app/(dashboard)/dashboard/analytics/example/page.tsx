"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  PieChart,
  Download,
  Eye,
  Briefcase,
  Mail,
  FileSpreadsheet,
  FileJson,
  Calendar,
  ExternalLink,
  Sparkles,
} from "lucide-react";

// =====================================================
// Mock Data
// =====================================================

const MOCK_WEEKLY_VIEWS = [42, 58, 73, 65, 91, 84, 110, 98, 125, 137, 152, 148];

const MOCK_PLATFORM_BREAKDOWN = [
  { name: "Instagram", percentage: 45, color: "bg-pink-500" },
  { name: "TikTok", percentage: 30, color: "bg-gray-800" },
  { name: "YouTube", percentage: 15, color: "bg-red-500" },
  { name: "Twitter", percentage: 10, color: "bg-blue-400" },
];

const MOCK_POSTS = [
  {
    id: "1",
    platform: "Instagram",
    postUrl: "#",
    postedAt: "2026-02-04",
    views: 2340,
  },
  {
    id: "2",
    platform: "TikTok",
    postUrl: "#",
    postedAt: "2026-02-02",
    views: 5120,
  },
  {
    id: "3",
    platform: "Instagram",
    postUrl: "#",
    postedAt: "2026-01-29",
    views: 1890,
  },
  {
    id: "4",
    platform: "YouTube",
    postUrl: "#",
    postedAt: "2026-01-25",
    views: 8430,
  },
  {
    id: "5",
    platform: "TikTok",
    postUrl: "#",
    postedAt: "2026-01-21",
    views: 3760,
  },
];

const PLATFORM_TEXT_COLORS: Record<string, string> = {
  Instagram: "text-pink-500",
  TikTok: "text-gray-800",
  YouTube: "text-red-500",
  Twitter: "text-blue-400",
};

// =====================================================
// Chart Components
// =====================================================

function EngagementChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);

  return (
    <div className="h-32 flex items-end gap-1">
      {data.map((value, index) => (
        <motion.div
          key={index}
          initial={{ height: 0 }}
          animate={{ height: `${(value / max) * 100}%` }}
          transition={{ duration: 0.5, delay: index * 0.05 }}
          className="flex-1 bg-gradient-to-t from-coral to-rose rounded-t"
          style={{ minHeight: "4px" }}
          title={`${value} views`}
        />
      ))}
    </div>
  );
}

function PlatformBreakdown({
  data,
}: {
  data: Array<{ name: string; percentage: number; color: string }>;
}) {
  return (
    <div className="space-y-3">
      {data.map((platform, index) => (
        <motion.div
          key={platform.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="space-y-1"
        >
          <div className="flex justify-between text-sm">
            <span className="text-warm-gray-700">{platform.name}</span>
            <span className="text-warm-gray-500">{platform.percentage}%</span>
          </div>
          <div className="h-2 bg-warm-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${platform.percentage}%` }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`h-full ${platform.color} rounded-full`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// =====================================================
// Page Component
// =====================================================

export default function AnalyticsExamplePage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-warm-gray-500 hover:text-warm-gray-700 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Example banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-[--radius-xl] bg-gradient-to-r from-coral/10 to-rose/10 border border-coral/20"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-warm-gray-900">
              Advanced Analytics Preview
            </h2>
            <p className="text-sm text-warm-gray-600 mt-0.5">
              This is an example of what your analytics dashboard will look like
              once you reach 100 lifetime posts. All data shown below is sample
              data.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-warm-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-coral" />
          Your Stats
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-warm-gray-50 rounded-lg p-4 border border-warm-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center">
                <Eye size={20} className="text-coral" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warm-gray-900">1,247</p>
                <p className="text-sm text-warm-gray-500">Profile Views</p>
              </div>
            </div>
          </div>

          <div className="bg-warm-gray-50 rounded-lg p-4 border border-warm-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warm-gray-100 flex items-center justify-center">
                <Briefcase size={20} className="text-warm-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warm-gray-900">834</p>
                <p className="text-sm text-warm-gray-500">Portfolio Views</p>
              </div>
            </div>
          </div>

          <div className="bg-warm-gray-50 rounded-lg p-4 border border-warm-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center">
                <Mail size={20} className="text-coral" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warm-gray-900">23</p>
                <p className="text-sm text-warm-gray-500">Total Inquiries</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-warm-gray-200">
              <div>
                <p className="text-lg font-semibold text-warm-gray-800">8</p>
                <p className="text-xs text-warm-gray-500">Last 30 days</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-warm-gray-800">3</p>
                <p className="text-xs text-warm-gray-500">Last 7 days</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-warm-gray-900 flex items-center gap-2">
            <BarChart3 size={20} className="text-coral" />
            Advanced Analytics
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Trends */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-coral" />
              <h3 className="font-medium text-warm-gray-900">
                Engagement Trends
              </h3>
            </div>
            <div className="bg-warm-gray-50 rounded-lg p-4 border border-warm-gray-100">
              <EngagementChart data={MOCK_WEEKLY_VIEWS} />
              <div className="flex justify-between text-xs text-warm-gray-500 mt-2">
                <span>12 weeks ago</span>
                <span>This week</span>
              </div>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <PieChart size={16} className="text-rose" />
              <h3 className="font-medium text-warm-gray-900">
                Platform Breakdown
              </h3>
            </div>
            <div className="bg-warm-gray-50 rounded-lg p-4 border border-warm-gray-100">
              <PlatformBreakdown data={MOCK_PLATFORM_BREAKDOWN} />
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="mt-6 pt-6 border-t border-warm-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Download size={16} className="text-warm-gray-500" />
            <h3 className="font-medium text-warm-gray-900">Export Data</h3>
          </div>
          <div className="flex gap-3">
            <button
              disabled
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-warm-gray-200 text-warm-gray-400 cursor-not-allowed"
            >
              <FileSpreadsheet size={16} />
              Export CSV
            </button>
            <button
              disabled
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-warm-gray-200 text-warm-gray-400 cursor-not-allowed"
            >
              <FileJson size={16} />
              Export JSON
            </button>
          </div>
        </div>
      </motion.div>

      {/* Post Performance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-warm-gray-900 flex items-center gap-2">
            <BarChart3 size={20} className="text-coral" />
            Post Performance
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-warm-gray-100">
                <th className="text-left py-3 px-2 text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Post
                </th>
                <th className="text-left py-3 px-2 text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="text-left py-3 px-2 text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Date
                  </span>
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1 justify-end">
                    <Eye size={12} />
                    Views
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-gray-50">
              {MOCK_POSTS.map((post, index) => (
                <motion.tr
                  key={post.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.4 + index * 0.05 }}
                  className="hover:bg-warm-gray-50/50"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-warm-gray-100 flex items-center justify-center">
                        <BarChart3 size={16} className="text-warm-gray-400" />
                      </div>
                      <span className="text-warm-gray-400 hover:text-coral transition-colors cursor-pointer">
                        <ExternalLink size={14} />
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`text-sm font-medium ${PLATFORM_TEXT_COLORS[post.platform] || "text-warm-gray-500"}`}
                    >
                      {post.platform}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-warm-gray-600">
                    {new Date(post.postedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm font-medium text-warm-gray-900">
                      {post.views.toLocaleString()}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center py-8"
      >
        <p className="text-warm-gray-500 mb-4">
          Reach 100 lifetime posts to unlock Advanced Analytics
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full bg-gradient-to-r from-coral to-rose text-white hover:opacity-90 transition-opacity"
        >
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}

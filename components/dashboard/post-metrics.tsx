"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Lock,
  ArrowUpDown,
  Calendar,
  Eye,
  ExternalLink,
} from "lucide-react";
import type { Stats } from "@/lib/types/analytics";
import { FEATURE_REQUIREMENTS } from "@/lib/types/analytics";
import { FeatureGate } from "@/components/ui/feature-gate";

type PostData = {
  id: string;
  platform: string;
  postUrl: string | null;
  postedAt: string | null;
  views: number;
  likes: number;
  comments: number;
};

type SortField = "date" | "views";
type SortOrder = "asc" | "desc";

// Platform icon colors
const PLATFORM_COLORS: Record<string, string> = {
  instagram: "text-pink-500",
  tiktok: "text-gray-800",
  youtube: "text-red-500",
  twitter: "text-blue-400",
  facebook: "text-blue-600",
};

function getPlatformColor(platform: string): string {
  return PLATFORM_COLORS[platform.toLowerCase()] || "text-warm-gray-500";
}

export function PostMetrics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats for feature access check
        const statsResponse = await fetch("/api/user/stats");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);

          // Only fetch post metrics if user has access
          if (statsData.analyticsFeatures?.detailedPostMetrics) {
            const postsResponse = await fetch("/api/user/analytics/posts");
            if (postsResponse.ok) {
              const postsData = await postsResponse.json();
              setPosts(postsData.posts || []);
            }
          }
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    const multiplier = sortOrder === "asc" ? 1 : -1;
    if (sortField === "views") {
      return (a.views - b.views) * multiplier;
    }
    // Sort by date
    const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
    const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
    return (dateA - dateB) * multiplier;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-warm-gray-200 rounded w-1/3" />
          <div className="h-64 bg-warm-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!stats || !stats.hasSubdomain) {
    return null;
  }

  const features = stats.analyticsFeatures;
  const hasAccess = features?.detailedPostMetrics ?? false;

  return (
    <div className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-lg font-semibold text-warm-gray-900 flex items-center gap-2">
          <BarChart3 size={20} className="text-coral" />
          Post Performance
        </h2>
        {!hasAccess && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-warm-gray-100 text-warm-gray-500">
            <Lock size={12} />
            {FEATURE_REQUIREMENTS.detailedPostMetrics.label}
          </span>
        )}
      </div>

      <FeatureGate
        unlocked={hasAccess}
        unlockRequirement={FEATURE_REQUIREMENTS.detailedPostMetrics.label}
        showTeaser={true}
      >
        {posts.length === 0 ? (
          <div className="text-center py-8 text-warm-gray-500 text-sm">
            No posts yet
          </div>
        ) : (
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
                  <th className="text-left py-3 px-2">
                    <button
                      onClick={() => toggleSort("date")}
                      className="flex items-center gap-1 text-xs font-medium text-warm-gray-500 uppercase tracking-wider hover:text-warm-gray-700"
                    >
                      <Calendar size={12} />
                      Date
                      <ArrowUpDown
                        size={12}
                        className={
                          sortField === "date"
                            ? "text-coral"
                            : "text-warm-gray-400"
                        }
                      />
                    </button>
                  </th>
                  <th className="text-right py-3 px-2">
                    <button
                      onClick={() => toggleSort("views")}
                      className="flex items-center gap-1 text-xs font-medium text-warm-gray-500 uppercase tracking-wider hover:text-warm-gray-700 ml-auto"
                    >
                      <Eye size={12} />
                      Views
                      <ArrowUpDown
                        size={12}
                        className={
                          sortField === "views"
                            ? "text-coral"
                            : "text-warm-gray-400"
                        }
                      />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-gray-50">
                {sortedPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-warm-gray-50/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-warm-gray-100 flex items-center justify-center">
                          <BarChart3 size={16} className="text-warm-gray-400" />
                        </div>
                        {post.postUrl && (
                          <a
                            href={post.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-warm-gray-400 hover:text-coral transition-colors"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-sm font-medium capitalize ${getPlatformColor(post.platform)}`}
                      >
                        {post.platform}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-warm-gray-600">
                      {post.postedAt
                        ? new Date(post.postedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-sm font-medium text-warm-gray-900">
                        {post.views.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FeatureGate>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck2,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ArrowUpDown,
  Calendar,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Loader2,
  Inbox,
  Sparkles,
} from "lucide-react";

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

export type ContentPost = {
  id: string;
  platform: string;
  postUrl: string;
  content: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  postedAt: string | null;
  discoveredAt: string;
  matchedHook: string | null;
  confidence: string | null;
  jobId: string | null;
  jobTitle: string | null;
  thumbnailUrl: string | null;
};

type SortField = "date" | "views" | "likes" | "comments";
type SortOrder = "asc" | "desc";

/* ──────────────────────────────────────────────
   Platform styling
   ────────────────────────────────────────────── */

const PLATFORM_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  tiktok: {
    label: "TikTok",
    color: "text-gray-900",
    bg: "bg-gray-900/8",
  },
  instagram: {
    label: "Instagram",
    color: "text-pink-600",
    bg: "bg-pink-600/8",
  },
  youtube: {
    label: "YouTube",
    color: "text-red-600",
    bg: "bg-red-600/8",
  },
  twitter: {
    label: "Twitter",
    color: "text-sky-500",
    bg: "bg-sky-500/8",
  },
  facebook: {
    label: "Facebook",
    color: "text-blue-600",
    bg: "bg-blue-600/8",
  },
};

function getPlatformConfig(platform: string) {
  return (
    PLATFORM_CONFIG[platform.toLowerCase()] ?? {
      label: platform,
      color: "text-warm-gray-600",
      bg: "bg-warm-gray-100",
    }
  );
}

/* ──────────────────────────────────────────────
   Number formatter
   ────────────────────────────────────────────── */

function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ──────────────────────────────────────────────
   Props
   ────────────────────────────────────────────── */

interface ContentPostsTableProps {
  /** Limit how many rows to show (for compact/preview mode) */
  limit?: number;
  /** If true, shows a minimal version (fewer columns) */
  compact?: boolean;
  /** Callback for "View all" if in compact mode */
  onViewAll?: () => void;
}

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */

export function ContentPostsTable({
  limit,
  compact = false,
  onViewAll,
}: ContentPostsTableProps) {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/user/content-posts");
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        } else if (res.status === 401) {
          setError("Please sign in to view your posts");
        } else {
          setError("Failed to load posts");
        }
      } catch {
        setError("Failed to load posts");
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  /* ── Sorting ── */
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedPosts = useMemo(() => {
    const sorted = [...posts].sort((a, b) => {
      const mul = sortOrder === "asc" ? 1 : -1;
      switch (sortField) {
        case "views":
          return ((a.views ?? 0) - (b.views ?? 0)) * mul;
        case "likes":
          return ((a.likes ?? 0) - (b.likes ?? 0)) * mul;
        case "comments":
          return ((a.comments ?? 0) - (b.comments ?? 0)) * mul;
        case "date":
        default: {
          const da = a.postedAt
            ? new Date(a.postedAt).getTime()
            : new Date(a.discoveredAt).getTime();
          const db_ = b.postedAt
            ? new Date(b.postedAt).getTime()
            : new Date(b.discoveredAt).getTime();
          return (da - db_) * mul;
        }
      }
    });
    return limit ? sorted.slice(0, limit) : sorted;
  }, [posts, sortField, sortOrder, limit]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-warm-gray-200 rounded" />
            <div className="h-6 bg-warm-gray-200 rounded w-48" />
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-warm-gray-50 rounded-[var(--radius-lg)]"
            />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 p-6">
        <p className="text-sm text-warm-gray-500">{error}</p>
      </div>
    );
  }

  /* ── Empty ── */
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-coral/8 flex items-center justify-center mb-4">
            <Inbox size={24} className="text-coral/60" />
          </div>
          <h3 className="font-semibold text-warm-gray-900 mb-1">
            No recognized posts yet
          </h3>
          <p className="text-sm text-warm-gray-500 max-w-sm">
            Tag <span className="font-medium text-warm-gray-700">@ugc.community</span> in
            your TikTok content and we&apos;ll automatically detect and track it here.
          </p>
        </div>
      </div>
    );
  }

  /* ── Sortable column header ── */
  const SortHeader = ({
    field,
    children,
    icon: Icon,
    align = "left",
  }: {
    field: SortField;
    children: React.ReactNode;
    icon: typeof Eye;
    align?: "left" | "right";
  }) => (
    <button
      onClick={() => toggleSort(field)}
      className={`group flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
        sortField === field
          ? "text-coral"
          : "text-warm-gray-400 hover:text-warm-gray-600"
      } ${align === "right" ? "ml-auto" : ""}`}
    >
      <Icon size={12} />
      {children}
      <ArrowUpDown
        size={11}
        className={
          sortField === field
            ? "text-coral"
            : "text-warm-gray-300 group-hover:text-warm-gray-400"
        }
      />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 pb-4 sm:px-6 sm:pt-6">
        <h2 className="text-base sm:text-lg font-semibold text-warm-gray-900 flex items-center gap-2.5">
          <FileCheck2 size={20} className="text-coral" />
          Recognized Posts
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-warm-gray-400 bg-warm-gray-50 px-2.5 py-1 rounded-full">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </span>
          {compact && onViewAll && posts.length > (limit ?? 0) && (
            <button
              onClick={onViewAll}
              className="text-sm font-medium text-coral hover:text-coral-dark transition-colors"
            >
              View all →
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full">
          <thead>
            <tr className="border-y border-warm-gray-100 bg-warm-gray-50/50">
              <th className="text-left py-3 px-6 text-xs font-medium text-warm-gray-400 uppercase tracking-wider">
                Post
              </th>
              {!compact && (
                <th className="text-left py-3 px-3 text-xs font-medium text-warm-gray-400 uppercase tracking-wider">
                  Contract
                </th>
              )}
              <th className="py-3 px-3">
                <SortHeader field="date" icon={Calendar}>
                  Date
                </SortHeader>
              </th>
              <th className="py-3 px-3">
                <SortHeader field="views" icon={Eye} align="right">
                  Views
                </SortHeader>
              </th>
              <th className="py-3 px-3">
                <SortHeader field="likes" icon={Heart} align="right">
                  Likes
                </SortHeader>
              </th>
              {!compact && (
                <>
                  <th className="py-3 px-3">
                    <SortHeader
                      field="comments"
                      icon={MessageCircle}
                      align="right"
                    >
                      Comments
                    </SortHeader>
                  </th>
                  <th className="py-3 px-3 text-right text-xs font-medium text-warm-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 justify-end">
                      <Share2 size={12} />
                      Shares
                    </span>
                  </th>
                </>
              )}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-gray-50">
            {sortedPosts.map((post, idx) => {
              const platform = getPlatformConfig(post.platform);
              const isExpanded = expandedRow === post.id;

              return (
                <motion.tr
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group hover:bg-warm-gray-50/60 transition-colors"
                >
                  {/* Post info */}
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Platform badge */}
                      <span
                        className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md ${platform.bg} ${platform.color} flex-shrink-0`}
                      >
                        {platform.label}
                      </span>
                      {/* Caption preview */}
                      {post.content && !compact && (
                        <span className="text-sm text-warm-gray-500 truncate max-w-[200px]">
                          {post.content}
                        </span>
                      )}
                      {/* External link */}
                      <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-warm-gray-300 hover:text-coral transition-colors flex-shrink-0 inline-flex min-h-11 min-w-11 items-center justify-center"
                        title="Open post"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </td>

                  {/* Contract / Job */}
                  {!compact && (
                    <td className="py-3.5 px-3">
                      {post.jobTitle ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-warm-gray-700 max-w-[180px] truncate">
                          <Briefcase
                            size={13}
                            className="text-warm-gray-400 flex-shrink-0"
                          />
                          {post.jobTitle}
                        </span>
                      ) : (
                        <span className="text-sm text-warm-gray-300 italic">
                          General
                        </span>
                      )}
                    </td>
                  )}

                  {/* Date */}
                  <td className="py-3.5 px-3 text-sm text-warm-gray-600 whitespace-nowrap">
                    {formatDate(post.postedAt ?? post.discoveredAt)}
                  </td>

                  {/* Views */}
                  <td className="py-3.5 px-3 text-right">
                    <span className="text-sm font-medium text-warm-gray-900 tabular-nums">
                      {formatNumber(post.views)}
                    </span>
                  </td>

                  {/* Likes */}
                  <td className="py-3.5 px-3 text-right">
                    <span className="text-sm text-warm-gray-700 tabular-nums">
                      {formatNumber(post.likes)}
                    </span>
                  </td>

                  {/* Comments */}
                  {!compact && (
                    <td className="py-3.5 px-3 text-right">
                      <span className="text-sm text-warm-gray-700 tabular-nums">
                        {formatNumber(post.comments)}
                      </span>
                    </td>
                  )}

                  {/* Shares */}
                  {!compact && (
                    <td className="py-3.5 px-3 text-right">
                      <span className="text-sm text-warm-gray-700 tabular-nums">
                        {formatNumber(post.shares)}
                      </span>
                    </td>
                  )}

                  {/* Expand toggle */}
                  <td className="py-3.5 pr-4">
                    <button
                      onClick={() =>
                        setExpandedRow(isExpanded ? null : post.id)
                      }
                      aria-label={`${isExpanded ? "Hide" : "Show"} details for ${post.content || platform.label + " post"}`}
                      aria-expanded={isExpanded}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-warm-gray-100 text-warm-gray-300 hover:text-warm-gray-500 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                  </td>

                  {/* Expanded detail row (using a trick with colSpan in the next row) */}
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {/* Expanded detail panels (rendered outside table for cleaner layout) */}
        <AnimatePresence>
          {sortedPosts.map((post) => {
            if (expandedRow !== post.id) return null;
            const platform = getPlatformConfig(post.platform);

            return (
              <motion.div
                key={`detail-${post.id}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden border-b border-warm-gray-100"
              >
                <div className="px-6 py-4 bg-warm-gray-50/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Full engagement breakdown */}
                    <EngagementStat
                      icon={Eye}
                      label="Views"
                      value={post.views}
                      color="text-coral"
                    />
                    <EngagementStat
                      icon={Heart}
                      label="Likes"
                      value={post.likes}
                      color="text-pink-500"
                    />
                    <EngagementStat
                      icon={MessageCircle}
                      label="Comments"
                      value={post.comments}
                      color="text-blue-500"
                    />
                    <EngagementStat
                      icon={Share2}
                      label="Shares"
                      value={post.shares}
                      color="text-emerald-500"
                    />
                  </div>

                  {/* Additional details */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 pt-3 border-t border-warm-gray-200/60">
                    {post.saves !== null && post.saves > 0 && (
                      <span className="flex items-center gap-1.5 text-xs text-warm-gray-500">
                        <Bookmark size={12} className="text-amber-500" />
                        {formatNumber(post.saves)} saves
                      </span>
                    )}
                    {post.jobTitle && (
                      <span className="flex items-center gap-1.5 text-xs text-warm-gray-500">
                        <Briefcase size={12} />
                        Contract: {post.jobTitle}
                      </span>
                    )}
                    {post.confidence && (
                      <span className="flex items-center gap-1.5 text-xs text-warm-gray-500">
                        <Sparkles size={12} className="text-coral" />
                        Match: {post.confidence}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-xs text-warm-gray-400">
                      <Calendar size={12} />
                      Discovered {formatDate(post.discoveredAt)}
                    </span>
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-coral hover:text-coral-dark transition-colors"
                    >
                      <ExternalLink size={12} />
                      Open on {platform.label}
                    </a>
                  </div>

                  {/* Caption if present */}
                  {post.content && (
                    <p className="mt-3 text-sm text-warm-gray-600 leading-relaxed italic">
                      &ldquo;{post.content}&rdquo;
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer with view-all for compact mode */}
      {compact && onViewAll && posts.length > (limit ?? 0) && (
        <div className="px-6 py-3 border-t border-warm-gray-100 bg-warm-gray-50/30">
          <button
            onClick={onViewAll}
            className="text-sm font-medium text-coral hover:text-coral-dark transition-colors"
          >
            View all {posts.length} posts →
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────── */

function EngagementStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Eye;
  label: string;
  value: number | null;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-[var(--radius-md)] px-3.5 py-2.5 border border-warm-gray-100">
      <Icon size={16} className={color} />
      <div>
        <p className="text-base font-semibold text-warm-gray-900 tabular-nums leading-none">
          {formatNumber(value)}
        </p>
        <p className="text-[11px] text-warm-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

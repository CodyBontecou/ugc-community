"use client";

import { AvatarImage } from "@/components/avatar-image";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  BadgeCheck,
  Sparkles,
  Instagram,
  Youtube,
  Eye,
  X,
  Activity,
} from "lucide-react";
import type { CreatorTableRow } from "@/lib/directory/table-queries";
import { NICHE_LABELS, type Niche } from "@/lib/directory/constants";
import { Navbar } from "@/components/landing/navbar";

// ─── TikTok Icon ───────────────────────────────────────────
function TikTokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.72a8.16 8.16 0 004.76 1.52V6.79a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}

// ─── Helpers ───────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    return val >= 100 ? `${Math.round(val)}M` : `${val.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const val = n / 1_000;
    return val >= 100 ? `${Math.round(val)}K` : `${val.toFixed(1)}K`;
  }
  return n.toLocaleString();
}

function formatPercent(n: number): string {
  if (n === 0) return "—";
  if (n < 0.1) return "<0.1%";
  return `${n.toFixed(1)}%`;
}

function formatRelativeDate(isoString: string | null): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function formatDate(isoString: string | null): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

// ─── Types ─────────────────────────────────────────────────
type SortKey =
  | "name"
  | "totalPosts"
  | "totalViews"
  | "totalLikes"
  | "totalComments"
  | "totalShares"
  | "avgViews"
  | "engagementRate"
  | "portfolioViewCount"
  | "directoryJoinedAt"
  | "lastPostDate"
  | "lastScrapedAt";

type SortDir = "asc" | "desc";

interface Column {
  key: SortKey | "creator" | "platforms" | "niches" | "location" | "rate" | "status";
  label: string;
  sortable: boolean;
  align?: "left" | "right" | "center";
  minWidth?: number;
  sticky?: boolean;
}

const COLUMNS: Column[] = [
  { key: "creator", label: "Account", sortable: true, align: "left", minWidth: 220, sticky: true },
  { key: "platforms", label: "Platform", sortable: false, align: "center", minWidth: 80 },
  { key: "totalPosts", label: "Posts", sortable: true, align: "right", minWidth: 70 },
  { key: "totalViews", label: "Total Views", sortable: true, align: "right", minWidth: 100 },
  { key: "avgViews", label: "Avg Views", sortable: true, align: "right", minWidth: 100 },
  { key: "totalLikes", label: "Total Likes", sortable: true, align: "right", minWidth: 100 },
  { key: "totalComments", label: "Total Comments", sortable: true, align: "right", minWidth: 115 },
  { key: "totalShares", label: "Total Shares", sortable: true, align: "right", minWidth: 100 },
  { key: "engagementRate", label: "Avg Engagement Rate", sortable: true, align: "right", minWidth: 150 },
  { key: "portfolioViewCount", label: "Portfolio Views", sortable: true, align: "right", minWidth: 115 },
  { key: "niches", label: "Collections", sortable: false, align: "left", minWidth: 140 },
  { key: "rate", label: "Rate", sortable: false, align: "center", minWidth: 90 },
  { key: "status", label: "Status", sortable: false, align: "center", minWidth: 100 },
  { key: "directoryJoinedAt", label: "First Tracked", sortable: true, align: "left", minWidth: 105 },
  { key: "lastPostDate", label: "Last Post", sortable: true, align: "left", minWidth: 100 },
  { key: "lastScrapedAt", label: "Last Tracked", sortable: true, align: "left", minWidth: 105 },
];

// ─── Computed values ──────────────────────────────────────
function getAvgViews(c: CreatorTableRow): number {
  return c.totalPosts > 0 ? Math.round(c.totalViews / c.totalPosts) : 0;
}

function getEngagementRate(c: CreatorTableRow): number {
  if (c.totalViews === 0) return 0;
  return ((c.totalLikes + c.totalComments + c.totalShares) / c.totalViews) * 100;
}

// ─── Component ────────────────────────────────────────────
interface CreatorsDataTableProps {
  creators: CreatorTableRow[];
}

export function CreatorsDataTable({ creators }: CreatorsDataTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalViews");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedAndFiltered = useMemo(() => {
    let result = creators;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const name = (c.displayName || c.name).toLowerCase();
        const sub = c.subdomain.toLowerCase();
        const niches = (c.niches || []).join(" ").toLowerCase();
        const loc = [c.locationCity, c.locationCountry].filter(Boolean).join(" ").toLowerCase();
        return name.includes(q) || sub.includes(q) || niches.includes(q) || loc.includes(q);
      });
    }

    result = [...result].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortKey) {
        case "name":
          aVal = (a.displayName || a.name).toLowerCase();
          bVal = (b.displayName || b.name).toLowerCase();
          break;
        case "avgViews":
          aVal = getAvgViews(a);
          bVal = getAvgViews(b);
          break;
        case "engagementRate":
          aVal = getEngagementRate(a);
          bVal = getEngagementRate(b);
          break;
        case "directoryJoinedAt":
        case "lastPostDate":
        case "lastScrapedAt":
          aVal = a[sortKey] ? new Date(a[sortKey]!).getTime() : 0;
          bVal = b[sortKey] ? new Date(b[sortKey]!).getTime() : 0;
          break;
        default:
          aVal = (a as any)[sortKey] ?? 0;
          bVal = (b as any)[sortKey] ?? 0;
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [creators, search, sortKey, sortDir]);

  function SortIcon({ columnKey }: { columnKey: SortKey }) {
    if (sortKey !== columnKey) {
      return <ArrowUpDown size={12} className="text-gray-300 ml-1 shrink-0" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="text-indigo-500 ml-1 shrink-0" />
    ) : (
      <ArrowDown size={12} className="text-indigo-500 ml-1 shrink-0" />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="h-16" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-8 pb-12">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Search */}
          <div className="relative w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <span className="text-sm text-gray-400">
            {sortedAndFiltered.length} of {creators.length} creators
          </span>
        </div>

        {/* Table card */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: "1700px" }}>
              {/* Header */}
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/60">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      style={{ minWidth: col.minWidth }}
                      className={`
                        px-3 py-2.5 font-medium text-gray-500 text-xs whitespace-nowrap
                        ${col.sticky ? "sticky left-0 z-20 bg-gray-50 border-r border-gray-200" : ""}
                        ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                      `}
                    >
                      {col.sortable ? (
                        <button
                          onClick={() => toggleSort(col.key as SortKey)}
                          className={`inline-flex items-center gap-0.5 hover:text-gray-700 transition-colors ${
                            sortKey === col.key ? "text-indigo-600 font-semibold" : ""
                          }`}
                        >
                          {col.label}
                          <SortIcon columnKey={col.key as SortKey} />
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {sortedAndFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="text-center py-16 text-gray-400 text-sm">
                      {search ? "No creators match your search." : "No creators found."}
                      {search && (
                        <button onClick={() => setSearch("")} className="ml-2 text-indigo-500 hover:underline">
                          Clear
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  sortedAndFiltered.map((creator) => {
                    const name = creator.displayName || creator.name;
                    const niches = (creator.niches || []).slice(0, 3) as Niche[];
                    const locationText = [creator.locationCity, creator.locationCountry].filter(Boolean).join(", ");
                    const avgViews = getAvgViews(creator);
                    const engRate = getEngagementRate(creator);
                    const hasInstagram = (creator.instagramHandles?.length ?? 0) > 0;
                    const hasTiktok = (creator.tiktokHandles?.length ?? 0) > 0;
                    const hasYoutube = (creator.youtubeHandles?.length ?? 0) > 0;

                    return (
                      <tr
                        key={creator.id}
                        className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Account */}
                        <td className="sticky left-0 z-10 bg-white hover:bg-gray-50/50 border-r border-gray-200 px-3 py-2.5 transition-colors">
                          <Link href={`/creators/${creator.subdomain}`} className="flex items-center gap-2.5 group">
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-100">
                              {creator.image ? (
                                <AvatarImage size={32} src={creator.image} alt={name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-medium">
                                  {name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                  {name}
                                </span>
                                {creator.isVerified && <BadgeCheck size={13} className="text-blue-500 shrink-0" />}
                              </div>
                            </div>
                          </Link>
                        </td>

                        {/* Platform */}
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-gray-400">
                            {hasInstagram && <Instagram size={14} strokeWidth={1.5} />}
                            {hasTiktok && <TikTokIcon size={14} />}
                            {hasYoutube && <Youtube size={14} strokeWidth={1.5} />}
                            {!hasInstagram && !hasTiktok && !hasYoutube && "—"}
                          </div>
                        </td>

                        {/* Posts */}
                        <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                          {creator.totalPosts > 0 ? creator.totalPosts.toLocaleString() : "—"}
                        </td>

                        {/* Total Views */}
                        <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                          {creator.totalViews > 0 ? formatNumber(creator.totalViews) : "—"}
                        </td>

                        {/* Avg Views */}
                        <td className="px-3 py-2.5 text-right tabular-nums text-gray-500">
                          {avgViews > 0 ? formatNumber(avgViews) : "—"}
                        </td>

                        {/* Total Likes */}
                        <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                          {creator.totalLikes > 0 ? formatNumber(creator.totalLikes) : "—"}
                        </td>

                        {/* Total Comments */}
                        <td className="px-3 py-2.5 text-right tabular-nums text-gray-500">
                          {creator.totalComments > 0 ? formatNumber(creator.totalComments) : "—"}
                        </td>

                        {/* Total Shares */}
                        <td className="px-3 py-2.5 text-right tabular-nums text-gray-500">
                          {creator.totalShares > 0 ? formatNumber(creator.totalShares) : "—"}
                        </td>

                        {/* Engagement Rate */}
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {engRate > 0 ? (
                            <span className={engRate >= 10 ? "text-green-600" : engRate >= 5 ? "text-blue-600" : "text-gray-600"}>
                              {formatPercent(engRate)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Portfolio Views */}
                        <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                          {creator.portfolioViewCount > 0 ? formatNumber(creator.portfolioViewCount) : "0"}
                        </td>

                        {/* Collections / Niches */}
                        <td className="px-3 py-2.5">
                          {niches.length > 0 ? (
                            <span className="text-gray-600 text-xs">
                              {niches.map((n) => NICHE_LABELS[n] || n).join(", ")}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Rate */}
                        <td className="px-3 py-2.5 text-center text-xs text-gray-600">
                          {creator.rateRange ? (
                            <span className="capitalize">{creator.rateRange}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {creator.availableForHire && (
                              <span className="inline-block w-2 h-2 rounded-full bg-green-400" title="Available for hire" />
                            )}
                            {creator.isFeatured && (
                              <Sparkles size={12} className="text-amber-500" />
                            )}
                            {!creator.availableForHire && !creator.isFeatured && (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>

                        {/* First Tracked */}
                        <td className="px-3 py-2.5 text-xs text-gray-500 tabular-nums">
                          {formatDate(creator.directoryJoinedAt || creator.createdAt)}
                        </td>

                        {/* Last Post */}
                        <td className="px-3 py-2.5 text-xs text-gray-500">
                          {formatRelativeDate(creator.lastPostDate)}
                        </td>

                        {/* Last Tracked */}
                        <td className="px-3 py-2.5 text-xs text-gray-500">
                          {formatRelativeDate(creator.lastScrapedAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {sortedAndFiltered.length > 0 && (
            <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-400 text-center">
              You&apos;ve reached the end
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

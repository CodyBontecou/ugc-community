"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  X,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Users,
} from "lucide-react";
import {
  NICHES,
  NICHE_LABELS,
  RATE_RANGES,
  RATE_RANGE_LABELS,
  SORT_OPTIONS,
  type Niche,
  type RateRange,
  type SortOption,
} from "@/lib/directory/constants";
import type { DirectoryCreator } from "@/lib/directory/queries";
import { CreatorCard } from "./creator-card";

interface CreatorDirectoryProps {
  initialCreators: DirectoryCreator[];
  initialTotal: number;
}

export function CreatorDirectory({
  initialCreators,
  initialTotal,
}: CreatorDirectoryProps) {
  const [creators, setCreators] = useState(initialCreators);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialTotal > 24);

  // Filters
  const [selectedNiches, setSelectedNiches] = useState<Niche[]>([]);
  const [location, setLocation] = useState("");
  const [rateRange, setRateRange] = useState<RateRange | "">("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("popular");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadingRef = useRef(false);

  const buildQueryString = useCallback(
    (pageNum: number) => {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("sort", sort);
      if (selectedNiches.length > 0)
        params.set("niches", selectedNiches.join(","));
      if (location) params.set("location", location);
      if (rateRange) params.set("rateRange", rateRange);
      if (availableOnly) params.set("availableForHire", "true");
      return params.toString();
    },
    [sort, selectedNiches, location, rateRange, availableOnly]
  );

  const fetchCreators = useCallback(
    async (pageNum: number, append = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        const qs = buildQueryString(pageNum);
        const res = await fetch(`/api/directory?${qs}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();

        if (append) {
          setCreators((prev) => [...prev, ...data.creators]);
        } else {
          setCreators(data.creators);
        }
        setTotal(data.total);
        setHasMore(pageNum * 24 < data.total);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to fetch creators:", error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [buildQueryString]
  );

  // Re-fetch when filters change
  useEffect(() => {
    fetchCreators(1, false);
  }, [sort, selectedNiches, location, rateRange, availableOnly, fetchCreators]);

  const loadMore = () => {
    if (!hasMore || loading) return;
    fetchCreators(page + 1, true);
  };

  const toggleNiche = (niche: Niche) => {
    setSelectedNiches((prev) =>
      prev.includes(niche)
        ? prev.filter((n) => n !== niche)
        : prev.length < 5
          ? [...prev, niche]
          : prev
    );
  };

  const clearFilters = () => {
    setSelectedNiches([]);
    setLocation("");
    setRateRange("");
    setAvailableOnly(false);
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedNiches.length > 0 || location || rateRange || availableOnly;

  // Client-side search filtering (name/tagline)
  const filteredCreators = searchQuery
    ? creators.filter((c) => {
        const q = searchQuery.toLowerCase();
        const name = (c.displayName || c.name).toLowerCase();
        const tagline = (c.tagline || "").toLowerCase();
        const niches = (c.niches || []).join(" ").toLowerCase();
        return name.includes(q) || tagline.includes(q) || niches.includes(q);
      })
    : creators;

  return (
    <div className="min-h-screen bg-cream">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-warm-gray-100">
        <div className="container flex items-center justify-between h-16">
          <Link
            href="/"
            className="font-semibold text-[1.1rem] text-warm-gray-900 hover:text-coral transition-colors"
          >
            ugc.community
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/creators"
              className="text-sm font-medium text-coral"
            >
              Creators
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-sm font-medium rounded-full py-2 px-5 bg-gradient-to-r from-coral to-rose text-white hover:opacity-90 transition-opacity"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-8 sm:pt-16 sm:pb-10">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-peach-100 via-peach-200/40 to-cream" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-rose/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-lavender/6 to-transparent rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 py-1.5 px-4 bg-white/80 border border-warm-gray-200 rounded-full text-sm font-medium text-warm-gray-600 mb-6 shadow-sm backdrop-blur-sm">
              <Users size={14} className="text-coral" />
              <span>
                {total} creator{total !== 1 ? "s" : ""} with live portfolios
              </span>
            </div>

            <h1 className="text-[clamp(2.2rem,5vw,3.5rem)] leading-[1.08] tracking-[-0.02em] mb-4">
              Discover{" "}
              <span className="gradient-text">UGC Creators</span>
            </h1>

            <p className="text-lg text-warm-gray-500 leading-relaxed mb-6">
              Browse creators with live portfolios. Find the perfect partner for
              your next campaign.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray-400"
              />
              <input
                type="text"
                placeholder="Search by name, niche, or keyword…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-warm-gray-200 rounded-full text-sm text-warm-gray-800 placeholder:text-warm-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose/30 focus:border-rose transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray-400 hover:text-warm-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-warm-gray-100 shadow-[0_4px_20px_rgba(26,22,20,0.03)]">
        <div className="container py-3 flex items-center gap-2.5 overflow-x-auto scrollbar-hide">
          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`shrink-0 inline-flex items-center gap-2 py-2.5 px-5 rounded-full text-[13px] font-semibold border transition-all duration-300 ${
              filtersOpen || hasActiveFilters
                ? "bg-warm-gray-900 text-white border-warm-gray-900 shadow-md"
                : "bg-white text-warm-gray-700 border-warm-gray-200 hover:border-warm-gray-300 hover:shadow-sm"
            }`}
          >
            <SlidersHorizontal size={14} />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-rose text-white text-[10px] flex items-center justify-center font-bold">
                {selectedNiches.length +
                  (location ? 1 : 0) +
                  (rateRange ? 1 : 0) +
                  (availableOnly ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Subtle divider */}
          <div className="shrink-0 w-px h-6 bg-warm-gray-200" />

          {/* Niche quick-filters */}
          <div className="flex gap-2">
            {NICHES.slice(0, 8).map((niche) => (
              <button
                key={niche}
                onClick={() => toggleNiche(niche)}
                className={`shrink-0 py-2.5 px-4 rounded-full text-[13px] font-medium border transition-all duration-300 ${
                  selectedNiches.includes(niche)
                    ? "bg-gradient-to-r from-coral to-rose text-white border-transparent shadow-[0_2px_12px_rgba(255,107,149,0.3)]"
                    : "bg-white text-warm-gray-600 border-warm-gray-200 hover:border-warm-gray-300 hover:text-warm-gray-800 hover:shadow-sm"
                }`}
              >
                {NICHE_LABELS[niche]}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="ml-auto shrink-0 relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none py-2.5 pl-4 pr-10 rounded-full text-[13px] font-semibold border border-warm-gray-200 bg-white text-warm-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose/30 hover:border-warm-gray-300 transition-all"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Expanded filters panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-warm-gray-100"
            >
              <div className="container py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Niches (all) */}
                <div>
                  <label className="block text-[10px] font-bold text-warm-gray-400 uppercase tracking-[0.15em] mb-3">
                    Niches
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {NICHES.map((niche) => (
                      <button
                        key={niche}
                        onClick={() => toggleNiche(niche)}
                        className={`py-1.5 px-3 rounded-full text-[11px] font-semibold border transition-all duration-300 ${
                          selectedNiches.includes(niche)
                            ? "bg-gradient-to-r from-coral to-rose text-white border-transparent shadow-sm"
                            : "bg-warm-gray-50 text-warm-gray-600 border-warm-gray-200 hover:border-warm-gray-300"
                        }`}
                      >
                        {NICHE_LABELS[niche]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[10px] font-bold text-warm-gray-400 uppercase tracking-[0.15em] mb-3">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="City or country…"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border border-warm-gray-200 bg-white text-warm-gray-800 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/30 transition-all"
                    />
                  </div>
                </div>

                {/* Rate Range */}
                <div>
                  <label className="block text-[10px] font-bold text-warm-gray-400 uppercase tracking-[0.15em] mb-3">
                    Rate Range
                  </label>
                  <div className="flex gap-2">
                    {RATE_RANGES.map((range) => (
                      <button
                        key={range}
                        onClick={() =>
                          setRateRange(rateRange === range ? "" : range)
                        }
                        className={`flex-1 py-2.5 rounded-xl text-[11px] font-semibold border transition-all duration-300 ${
                          rateRange === range
                            ? "bg-gradient-to-r from-coral to-rose text-white border-transparent shadow-sm"
                            : "bg-white text-warm-gray-600 border-warm-gray-200 hover:border-warm-gray-300"
                        }`}
                      >
                        {RATE_RANGE_LABELS[range]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability + Clear */}
                <div className="flex flex-col justify-between">
                  <div>
                    <label className="block text-[10px] font-bold text-warm-gray-400 uppercase tracking-[0.15em] mb-3">
                      Availability
                    </label>
                    <button
                      onClick={() => setAvailableOnly(!availableOnly)}
                      className={`w-full py-2.5 rounded-xl text-[11px] font-semibold border transition-all duration-300 ${
                        availableOnly
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                          : "bg-white text-warm-gray-600 border-warm-gray-200 hover:border-warm-gray-300"
                      }`}
                    >
                      {availableOnly
                        ? "✓ Available for Hire"
                        : "Available for Hire"}
                    </button>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-3 text-[11px] font-semibold text-rose hover:text-coral-dark transition-colors"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      <section className="container pt-6 pb-6 sm:pt-8 sm:pb-8">
        {/* Creator Grid */}
        {filteredCreators.length === 0 && !loading ? (
          <motion.div
            className="text-center py-24"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-peach-100 to-peach-200 flex items-center justify-center rotate-3">
              <Search size={28} className="text-coral -rotate-3" />
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl mb-2 text-warm-gray-800">
              No creators found
            </h3>
            <p className="text-warm-gray-500 mb-8 max-w-md mx-auto text-[15px] leading-relaxed">
              Try adjusting your filters or search to discover more creators.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 py-3 px-7 rounded-full text-sm font-semibold bg-gradient-to-r from-coral to-rose text-white hover:shadow-[0_8px_30px_rgba(255,107,149,0.3)] transition-all duration-300"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCreators.map((creator, i) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: Math.min(i * 0.06, 0.5),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <CreatorCard creator={creator} />
                </motion.div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <motion.div
                className="text-center mt-14"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="group/btn inline-flex items-center gap-2.5 py-3.5 px-9 rounded-full text-sm font-semibold border border-warm-gray-200 bg-white text-warm-gray-700 hover:border-coral hover:text-coral hover:shadow-[0_8px_30px_rgba(255,107,149,0.12)] transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-warm-gray-300 border-t-coral rounded-full animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      Load More Creators
                      <ArrowRight
                        size={15}
                        className="group-hover/btn:translate-x-1 transition-transform duration-300"
                      />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </>
        )}
      </section>
      {/* Result count — fixed bottom right */}
      <motion.div
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 py-2 px-4 bg-white/90 backdrop-blur-lg border border-warm-gray-100 rounded-full shadow-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-coral to-rose" />
        <p className="text-[12px] text-warm-gray-500 font-medium tracking-wide">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 border-[1.5px] border-warm-gray-200 border-t-coral rounded-full animate-spin" />
              Loading…
            </span>
          ) : (
            <>
              <span className="font-bold text-warm-gray-800 tabular-nums">
                {filteredCreators.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-warm-gray-800 tabular-nums">
                {total}
              </span>{" "}
              creators
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}

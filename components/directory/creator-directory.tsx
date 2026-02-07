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
  Users,
  Zap,
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
  const [searchFocused, setSearchFocused] = useState(false);

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
      <nav className="sticky top-0 z-50 bg-deep-900/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="container flex items-center justify-between h-16">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-[1.15rem] text-white/90 hover:text-white transition-colors"
          >
            ugc.community
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/creators"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Creators
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-sm font-semibold rounded-full py-2.5 px-6 bg-white text-deep-900 hover:bg-white/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header — Dark, Dramatic */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-20">
        {/* Deep dark base */}
        <div className="absolute inset-0 bg-deep-900" />

        {/* Animated gradient mesh */}
        <div
          className="absolute top-[-40%] right-[-20%] w-[700px] h-[700px] rounded-full opacity-40 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #FF6B95 0%, #FF9A8B 40%, transparent 70%)",
            animation: "mesh-drift 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-25 blur-[100px]"
          style={{
            background: "radial-gradient(circle, #A855F7 0%, #7C3AED 40%, transparent 70%)",
            animation: "mesh-drift-reverse 15s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-[20%] left-[40%] w-[300px] h-[300px] rounded-full opacity-20 blur-[80px]"
          style={{
            background: "radial-gradient(circle, #FFB8A9 0%, transparent 70%)",
            animation: "pulse-glow 6s ease-in-out infinite",
          }}
        />

        {/* Noise texture */}
        <div className="absolute inset-0 noise-overlay" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="container relative z-10">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2.5 py-2 px-5 bg-white/[0.07] border border-white/[0.1] rounded-full text-sm font-medium text-white/70 mb-8 backdrop-blur-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-coral to-rose">
                <Users size={11} className="text-white" />
              </div>
              <span>
                {total} creator{total !== 1 ? "s" : ""} with live portfolios
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-[clamp(2.6rem,6vw,4.5rem)] leading-[1.04] tracking-[-0.03em] mb-5 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              Discover{" "}
              <span className="gradient-text-light italic">
                UGC Creators
              </span>
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-white/45 leading-relaxed mb-10 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              Browse creators with live portfolios. Find the perfect partner for
              your next campaign.
            </motion.p>

            {/* Search Bar — Glassmorphism */}
            <motion.div
              className="relative max-w-xl mx-auto"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className={`relative transition-all duration-500 ${
                  searchFocused ? "scale-[1.02]" : ""
                }`}
              >
                {/* Glow behind search on focus */}
                <div
                  className={`absolute -inset-3 rounded-full bg-gradient-to-r from-coral/30 via-rose/20 to-lavender/30 blur-xl transition-opacity duration-500 ${
                    searchFocused ? "opacity-100" : "opacity-0"
                  }`}
                />
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <input
                    type="text"
                    placeholder="Search by name, niche, or keyword…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="w-full pl-13 pr-5 py-4 bg-white/[0.07] border border-white/[0.12] rounded-full text-[15px] text-white placeholder:text-white/30 backdrop-blur-xl shadow-lg focus:outline-none focus:border-white/25 focus:bg-white/[0.1] transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom gradient fade to content area */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream to-transparent" />
      </section>

      {/* Toolbar */}
      <div className="sticky top-16 z-40 bg-cream/90 backdrop-blur-xl border-b border-warm-gray-200/60">
        <div className="container py-3.5 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`shrink-0 inline-flex items-center gap-2 py-2.5 px-5 rounded-full text-sm font-semibold border transition-all duration-300 ${
              filtersOpen || hasActiveFilters
                ? "bg-deep-900 text-white border-deep-900 shadow-md"
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

          {/* Divider */}
          <div className="w-px h-6 bg-warm-gray-200 shrink-0" />

          {/* Niche quick-filters */}
          <div className="flex gap-2">
            {NICHES.slice(0, 8).map((niche) => (
              <button
                key={niche}
                onClick={() => toggleNiche(niche)}
                className={`shrink-0 py-2.5 px-4 rounded-full text-sm font-medium border transition-all duration-300 ${
                  selectedNiches.includes(niche)
                    ? "bg-gradient-to-r from-coral to-rose text-white border-transparent shadow-md shadow-coral/20"
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
              className="appearance-none py-2.5 pl-4 pr-9 rounded-full text-sm font-medium border border-warm-gray-200 bg-white text-warm-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose/30 hover:border-warm-gray-300 transition-colors"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray-400 pointer-events-none"
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
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-warm-gray-200/60"
            >
              <div className="container py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Niches (all) */}
                <div>
                  <label className="block text-xs font-bold text-warm-gray-500 uppercase tracking-wider mb-3">
                    Niches
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {NICHES.map((niche) => (
                      <button
                        key={niche}
                        onClick={() => toggleNiche(niche)}
                        className={`py-1.5 px-3 rounded-full text-xs font-medium border transition-all duration-200 ${
                          selectedNiches.includes(niche)
                            ? "bg-gradient-to-r from-coral to-rose text-white border-transparent"
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
                  <label className="block text-xs font-bold text-warm-gray-500 uppercase tracking-wider mb-3">
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
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border border-warm-gray-200 bg-white text-warm-gray-800 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/30 focus:border-rose/40 transition-all"
                    />
                  </div>
                </div>

                {/* Rate Range */}
                <div>
                  <label className="block text-xs font-bold text-warm-gray-500 uppercase tracking-wider mb-3">
                    Rate Range
                  </label>
                  <div className="flex gap-2">
                    {RATE_RANGES.map((range) => (
                      <button
                        key={range}
                        onClick={() =>
                          setRateRange(rateRange === range ? "" : range)
                        }
                        className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
                          rateRange === range
                            ? "bg-gradient-to-r from-coral to-rose text-white border-transparent"
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
                    <label className="block text-xs font-bold text-warm-gray-500 uppercase tracking-wider mb-3">
                      Availability
                    </label>
                    <button
                      onClick={() => setAvailableOnly(!availableOnly)}
                      className={`w-full py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
                        availableOnly
                          ? "bg-emerald-500 text-white border-emerald-500"
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
                      className="mt-3 text-xs font-semibold text-rose hover:text-coral-dark transition-colors"
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
      <section className="container py-10 sm:py-14">
        {/* Result count */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm text-warm-gray-500">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-warm-gray-300 border-t-coral rounded-full animate-spin" />
                Loading…
              </span>
            ) : (
              <>
                Showing{" "}
                <span className="font-bold text-warm-gray-800">
                  {filteredCreators.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-warm-gray-800">
                  {total}
                </span>{" "}
                creators
              </>
            )}
          </p>
        </motion.div>

        {/* Creator Grid */}
        {filteredCreators.length === 0 && !loading ? (
          <motion.div
            className="text-center py-24"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-peach-200 to-peach-300 flex items-center justify-center shadow-lg shadow-peach-200/50">
              <Search size={28} className="text-coral-dark" />
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl mb-3 text-warm-gray-800">
              No creators found
            </h3>
            <p className="text-warm-gray-500 mb-8 max-w-md mx-auto">
              Try adjusting your filters or search to discover more creators.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 py-3 px-7 rounded-full text-sm font-semibold bg-gradient-to-r from-coral to-rose text-white hover:shadow-lg hover:shadow-coral/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                className="text-center mt-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="group inline-flex items-center gap-2.5 py-3.5 px-9 rounded-full text-sm font-semibold border-2 border-warm-gray-200 bg-white text-warm-gray-700 hover:border-deep-900 hover:bg-deep-900 hover:text-white transition-all duration-300 disabled:opacity-50 hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-warm-gray-300 border-t-coral rounded-full animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      Load More Creators
                      <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

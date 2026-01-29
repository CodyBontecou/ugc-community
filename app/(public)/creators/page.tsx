"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CreatorGrid } from "@/components/directory/creator-grid";
import { DirectoryFilters } from "@/components/directory/directory-filters";
import { Pagination } from "@/components/directory/pagination";
import { Navbar } from "@/components/landing/navbar";
import { BackgroundBlobs } from "@/components/landing/background-blobs";
import type { DirectoryCreator } from "@/lib/directory/queries";
import type { Niche, RateRange, SortOption } from "@/lib/directory/constants";

interface ApiResponse {
  creators: DirectoryCreator[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

function DirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL params
  const initialNiches = searchParams.get("niches")?.split(",").filter(Boolean) as Niche[] || [];
  const initialLocation = searchParams.get("location") || "";
  const initialRateRange = searchParams.get("rateRange") as RateRange | null || null;
  const initialAvailable = searchParams.get("available") === "true";
  const initialSort = (searchParams.get("sort") as SortOption) || "popular";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  // State
  const [creators, setCreators] = useState<DirectoryCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [selectedNiches, setSelectedNiches] = useState<Niche[]>(initialNiches);
  const [location, setLocation] = useState(initialLocation);
  const [rateRange, setRateRange] = useState<RateRange | null>(initialRateRange);
  const [availableOnly, setAvailableOnly] = useState(initialAvailable);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [page, setPage] = useState(initialPage);

  // Debounced location search
  const [debouncedLocation, setDebouncedLocation] = useState(location);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(location);
      setPage(1); // Reset to first page on location change
    }, 300);
    return () => clearTimeout(timer);
  }, [location]);

  // Update URL when filters change
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedNiches.length > 0) params.set("niches", selectedNiches.join(","));
    if (debouncedLocation) params.set("location", debouncedLocation);
    if (rateRange) params.set("rateRange", rateRange);
    if (availableOnly) params.set("available", "true");
    if (sort !== "popular") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));

    const queryString = params.toString();
    router.replace(`/creators${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [selectedNiches, debouncedLocation, rateRange, availableOnly, sort, page, router]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  // Fetch creators
  useEffect(() => {
    async function fetchCreators() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedNiches.length > 0) params.set("niches", selectedNiches.join(","));
        if (debouncedLocation) params.set("location", debouncedLocation);
        if (rateRange) params.set("rateRange", rateRange);
        if (availableOnly) params.set("available", "true");
        params.set("sort", sort);
        params.set("page", String(page));

        const response = await fetch(`/api/directory/creators?${params.toString()}`);
        if (response.ok) {
          const data: ApiResponse = await response.json();
          setCreators(data.creators);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
        }
      } catch (error) {
        console.error("Failed to fetch creators:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCreators();
  }, [selectedNiches, debouncedLocation, rateRange, availableOnly, sort, page]);

  // Reset page when filters change
  const handleNichesChange = (niches: Niche[]) => {
    setSelectedNiches(niches);
    setPage(1);
  };

  const handleRateRangeChange = (range: RateRange | null) => {
    setRateRange(range);
    setPage(1);
  };

  const handleAvailableChange = (available: boolean) => {
    setAvailableOnly(available);
    setPage(1);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-cream relative">
      <BackgroundBlobs />
      <Navbar />

      {/* Header Section */}
      <header className="pt-32 pb-12 relative z-10">
        <div className="container">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-4">
              Creator Directory
            </h1>
            <p className="text-lg text-warm-gray-600 max-w-2xl mx-auto">
              Discover talented UGC creators for your next campaign
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-warm-gray-100">
            <DirectoryFilters
              selectedNiches={selectedNiches}
              onNichesChange={handleNichesChange}
              location={location}
              onLocationChange={setLocation}
              rateRange={rateRange}
              onRateRangeChange={handleRateRangeChange}
              availableOnly={availableOnly}
              onAvailableOnlyChange={handleAvailableChange}
              sort={sort}
              onSortChange={handleSortChange}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 relative z-10">
        {/* Results count */}
        {!loading && (
          <p className="text-sm text-warm-gray-500 mb-6">
            {total} creator{total !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Creator Grid */}
        <CreatorGrid creators={creators} loading={loading} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-warm-gray-200 py-8 relative z-10">
        <div className="container text-center">
          <Link
            href="/"
            className="text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
          >
            ugc.community
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default function CreatorsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="animate-pulse text-warm-gray-500">Loading...</div>
        </div>
      }
    >
      <DirectoryContent />
    </Suspense>
  );
}

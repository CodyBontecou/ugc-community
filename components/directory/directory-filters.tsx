"use client";

import { useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
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

interface DirectoryFiltersProps {
  selectedNiches: Niche[];
  onNichesChange: (niches: Niche[]) => void;
  location: string;
  onLocationChange: (location: string) => void;
  rateRange: RateRange | null;
  onRateRangeChange: (rateRange: RateRange | null) => void;
  availableOnly: boolean;
  onAvailableOnlyChange: (available: boolean) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function DirectoryFilters({
  selectedNiches,
  onNichesChange,
  location,
  onLocationChange,
  rateRange,
  onRateRangeChange,
  availableOnly,
  onAvailableOnlyChange,
  sort,
  onSortChange,
}: DirectoryFiltersProps) {
  const [nicheDropdownOpen, setNicheDropdownOpen] = useState(false);

  const toggleNiche = (niche: Niche) => {
    if (selectedNiches.includes(niche)) {
      onNichesChange(selectedNiches.filter((n) => n !== niche));
    } else {
      onNichesChange([...selectedNiches, niche]);
    }
  };

  const clearFilters = () => {
    onNichesChange([]);
    onLocationChange("");
    onRateRangeChange(null);
    onAvailableOnlyChange(false);
    onSortChange("popular");
  };

  const hasActiveFilters =
    selectedNiches.length > 0 ||
    location ||
    rateRange ||
    availableOnly ||
    sort !== "popular";

  return (
    <div className="space-y-4">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Location Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400"
          />
          <input
            type="text"
            placeholder="Search by location..."
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-warm-gray-200 rounded-lg text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender/20 focus:border-lavender"
          />
        </div>

        {/* Sort Dropdown */}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="px-4 py-2.5 bg-white border border-warm-gray-200 rounded-lg text-warm-gray-900 focus:outline-none focus:ring-2 focus:ring-lavender/20 focus:border-lavender appearance-none cursor-pointer min-w-[160px]"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Niche Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNicheDropdownOpen(!nicheDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-warm-gray-200 rounded-lg text-warm-gray-700 hover:border-warm-gray-300 transition-colors"
          >
            <span>
              {selectedNiches.length > 0
                ? `${selectedNiches.length} niche${selectedNiches.length > 1 ? "s" : ""}`
                : "All niches"}
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${nicheDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {nicheDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setNicheDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-64 max-h-80 overflow-y-auto bg-white border border-warm-gray-200 rounded-lg shadow-lg z-20">
                <div className="p-2 grid grid-cols-2 gap-1">
                  {NICHES.map((niche) => (
                    <button
                      key={niche}
                      onClick={() => toggleNiche(niche)}
                      className={`px-3 py-2 text-sm text-left rounded-md transition-colors ${
                        selectedNiches.includes(niche)
                          ? "bg-lavender text-white"
                          : "hover:bg-warm-gray-50 text-warm-gray-700"
                      }`}
                    >
                      {NICHE_LABELS[niche]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rate Range */}
        <select
          value={rateRange || ""}
          onChange={(e) =>
            onRateRangeChange(
              e.target.value ? (e.target.value as RateRange) : null
            )
          }
          className="px-4 py-2 bg-white border border-warm-gray-200 rounded-lg text-warm-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender/20 focus:border-lavender appearance-none cursor-pointer"
        >
          <option value="">Any rate</option>
          {RATE_RANGES.map((range) => (
            <option key={range} value={range}>
              {RATE_RANGE_LABELS[range]}
            </option>
          ))}
        </select>

        {/* Available Toggle */}
        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-warm-gray-200 rounded-lg cursor-pointer hover:border-warm-gray-300 transition-colors">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => onAvailableOnlyChange(e.target.checked)}
            className="w-4 h-4 rounded border-warm-gray-300 text-lavender focus:ring-lavender/20"
          />
          <span className="text-sm text-warm-gray-700">Available for hire</span>
        </label>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-warm-gray-500 hover:text-warm-gray-700 transition-colors"
          >
            <X size={14} />
            Clear filters
          </button>
        )}
      </div>

      {/* Active Niche Tags */}
      {selectedNiches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedNiches.map((niche) => (
            <button
              key={niche}
              onClick={() => toggleNiche(niche)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-lavender/10 text-lavender rounded-full text-sm hover:bg-lavender/20 transition-colors"
            >
              {NICHE_LABELS[niche]}
              <X size={14} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

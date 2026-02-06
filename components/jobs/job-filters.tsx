"use client";

import { Search, X } from "lucide-react";
import {
  NICHES,
  NICHE_LABELS,
  PLATFORMS,
  PLATFORM_LABELS,
  COMPENSATION_TYPES,
  COMPENSATION_TYPE_LABELS,
  type Niche,
  type Platform,
  type CompensationType,
} from "@/lib/jobs/constants";

interface JobFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedNiches: string[];
  onNichesChange: (niches: string[]) => void;
  selectedPlatforms: Platform[];
  onPlatformsChange: (platforms: Platform[]) => void;
  selectedCompensationType: CompensationType | "";
  onCompensationTypeChange: (type: CompensationType | "") => void;
  onClear: () => void;
}

export function JobFilters({
  search,
  onSearchChange,
  selectedNiches,
  onNichesChange,
  selectedPlatforms,
  onPlatformsChange,
  selectedCompensationType,
  onCompensationTypeChange,
  onClear,
}: JobFiltersProps) {
  const hasFilters =
    search ||
    selectedNiches.length > 0 ||
    selectedPlatforms.length > 0 ||
    selectedCompensationType;

  const toggleNiche = (niche: Niche) => {
    if (selectedNiches.includes(niche)) {
      onNichesChange(selectedNiches.filter((n) => n !== niche));
    } else {
      onNichesChange([...selectedNiches, niche]);
    }
  };

  const togglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      onPlatformsChange(selectedPlatforms.filter((p) => p !== platform));
    } else {
      onPlatformsChange([...selectedPlatforms, platform]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400"
        />
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {/* Platform filter */}
        <div className="flex items-center gap-1">
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              onClick={() => togglePlatform(platform)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedPlatforms.includes(platform)
                  ? "bg-coral text-white"
                  : "bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200"
              }`}
            >
              {PLATFORM_LABELS[platform]}
            </button>
          ))}
        </div>

        {/* Compensation type */}
        <select
          value={selectedCompensationType}
          onChange={(e) =>
            onCompensationTypeChange(e.target.value as CompensationType | "")
          }
          className="px-3 py-1 text-xs font-medium rounded-full bg-warm-gray-100 text-warm-gray-600 border-0 focus:ring-2 focus:ring-coral/20"
        >
          <option value="">All Compensation</option>
          {COMPENSATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {COMPENSATION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={onClear}
            className="px-3 py-1 text-xs font-medium rounded-full text-warm-gray-500 hover:bg-warm-gray-100 transition-colors flex items-center gap-1"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Niche filter (collapsible) */}
      <div className="flex flex-wrap gap-1">
        {NICHES.map((niche) => (
          <button
            key={niche}
            onClick={() => toggleNiche(niche)}
            className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
              selectedNiches.includes(niche)
                ? "bg-warm-gray-900 text-white"
                : "bg-warm-gray-50 text-warm-gray-500 hover:bg-warm-gray-100"
            }`}
          >
            {NICHE_LABELS[niche]}
          </button>
        ))}
      </div>
    </div>
  );
}

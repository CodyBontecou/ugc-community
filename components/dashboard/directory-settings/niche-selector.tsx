"use client";

import { NICHES, NICHE_LABELS, type Niche } from "@/lib/directory/constants";
import { X } from "lucide-react";

interface NicheSelectorProps {
  selected: Niche[];
  onChange: (niches: Niche[]) => void;
  maxNiches?: number;
}

export function NicheSelector({
  selected,
  onChange,
  maxNiches = 5,
}: NicheSelectorProps) {
  const toggleNiche = (niche: Niche) => {
    if (selected.includes(niche)) {
      onChange(selected.filter((n) => n !== niche));
    } else if (selected.length < maxNiches) {
      onChange([...selected, niche]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-warm-gray-700">
          Niches
        </label>
        <span className="text-xs text-warm-gray-500">
          {selected.length}/{maxNiches} selected
        </span>
      </div>

      {/* Selected niches */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {selected.map((niche) => (
            <button
              key={niche}
              onClick={() => toggleNiche(niche)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-lavender text-white rounded-full text-sm hover:bg-lavender/90 transition-colors"
            >
              {NICHE_LABELS[niche]}
              <X size={14} />
            </button>
          ))}
        </div>
      )}

      {/* Niche grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {NICHES.map((niche) => {
          const isSelected = selected.includes(niche);
          const isDisabled = !isSelected && selected.length >= maxNiches;

          return (
            <button
              key={niche}
              onClick={() => toggleNiche(niche)}
              disabled={isDisabled}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                isSelected
                  ? "bg-lavender/10 border-lavender text-lavender"
                  : isDisabled
                    ? "bg-warm-gray-50 border-warm-gray-100 text-warm-gray-300 cursor-not-allowed"
                    : "bg-white border-warm-gray-200 text-warm-gray-700 hover:border-warm-gray-300"
              }`}
            >
              {NICHE_LABELS[niche]}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-warm-gray-500">
        Select up to {maxNiches} niches that best describe your content
      </p>
    </div>
  );
}

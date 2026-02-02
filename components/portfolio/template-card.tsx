"use client";

import { useState } from "react";
import { Check, Palette } from "lucide-react";
import type { Template } from "@/lib/db/schema";

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (template: Template) => void;
  isLoading?: boolean;
}

export function TemplateCard({
  template,
  isSelected,
  onSelect,
  isLoading,
}: TemplateCardProps) {
  // Get theme colors for preview
  const themeDefaults = template.themeDefaults as {
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
      surface?: string;
    };
  };
  const colors = themeDefaults?.colors ?? {};

  return (
    <div
      className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
        isSelected
          ? "border-coral ring-2 ring-coral/20"
          : "border-warm-gray-200 hover:border-warm-gray-300"
      }`}
      onClick={() => !isLoading && onSelect(template)}
    >
      {/* Preview Area */}
      <div
        className="aspect-[4/3] relative overflow-hidden"
        style={{ backgroundColor: colors.background ?? "#fff" }}
      >
        {template.previewImageUrl ? (
          <img
            src={template.previewImageUrl}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          // Placeholder preview showing theme colors
          <div className="absolute inset-0 p-4 flex flex-col">
            {/* Mini hero */}
            <div
              className="flex-1 rounded-lg mb-2 flex items-center justify-center"
              style={{ backgroundColor: colors.surface ?? "#f5f5f5" }}
            >
              <div className="text-center space-y-2">
                <div
                  className="w-16 h-2 rounded mx-auto"
                  style={{ backgroundColor: colors.primary ?? "#000" }}
                />
                <div
                  className="w-24 h-1.5 rounded mx-auto opacity-50"
                  style={{ backgroundColor: colors.secondary ?? "#666" }}
                />
              </div>
            </div>
            {/* Mini work grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded"
                  style={{ backgroundColor: colors.surface ?? "#f5f5f5" }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Selected overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-coral/10 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-coral flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-warm-gray-900">{template.name}</h3>
          {/* Color swatches */}
          <div className="flex -space-x-1">
            {[colors.primary, colors.accent, colors.surface]
              .filter(Boolean)
              .map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border-2 border-white"
                  style={{ backgroundColor: color }}
                />
              ))}
          </div>
        </div>
        <p className="text-sm text-warm-gray-500 line-clamp-2">
          {template.description}
        </p>

        {/* Use button */}
        <button
          className={`mt-3 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            isSelected
              ? "bg-coral text-white"
              : "bg-warm-gray-100 text-warm-gray-700 hover:bg-warm-gray-200"
          }`}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Selecting...
            </span>
          ) : isSelected ? (
            "Selected"
          ) : (
            "Use This Template"
          )}
        </button>
      </div>
    </div>
  );
}

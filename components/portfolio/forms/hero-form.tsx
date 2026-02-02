"use client";

import { useState } from "react";
import type { SectionContent } from "@/lib/db/schema";

interface HeroFormProps {
  content: SectionContent | undefined;
  onChange: (content: SectionContent) => void;
}

export function HeroForm({ content, onChange }: HeroFormProps) {
  const [formData, setFormData] = useState({
    headline: content?.headline ?? "",
    subheadline: content?.subheadline ?? "",
    ctaText: content?.ctaText ?? "",
    ctaLink: content?.ctaLink ?? "",
    showScrollIndicator: content?.showScrollIndicator ?? true,
  });

  function handleChange(key: keyof typeof formData, value: string | boolean) {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-warm-gray-700 mb-1">
          Headline
        </label>
        <input
          type="text"
          value={formData.headline}
          onChange={(e) => handleChange("headline", e.target.value)}
          placeholder="Your main headline..."
          className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
        />
        <p className="mt-1 text-xs text-warm-gray-500">
          The big text visitors see first
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-gray-700 mb-1">
          Subheadline
        </label>
        <textarea
          value={formData.subheadline}
          onChange={(e) => handleChange("subheadline", e.target.value)}
          placeholder="A brief description..."
          rows={2}
          className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-gray-700 mb-1">
            CTA Button Text
          </label>
          <input
            type="text"
            value={formData.ctaText}
            onChange={(e) => handleChange("ctaText", e.target.value)}
            placeholder="View My Work"
            className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-gray-700 mb-1">
            CTA Link
          </label>
          <input
            type="text"
            value={formData.ctaLink}
            onChange={(e) => handleChange("ctaLink", e.target.value)}
            placeholder="#work"
            className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 p-3 bg-warm-gray-50 rounded-lg cursor-pointer">
        <input
          type="checkbox"
          checked={formData.showScrollIndicator}
          onChange={(e) => handleChange("showScrollIndicator", e.target.checked)}
          className="w-4 h-4 text-coral border-warm-gray-300 rounded focus:ring-coral/50"
        />
        <span className="text-sm text-warm-gray-700">
          Show scroll indicator animation
        </span>
      </label>
    </div>
  );
}

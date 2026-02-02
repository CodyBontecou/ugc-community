"use client";

import { useState, useCallback } from "react";
import { Check, AlertCircle } from "lucide-react";
import type { PortfolioConfig } from "@/lib/db/schema";

interface SeoEditorProps {
  config: PortfolioConfig;
  subdomain: string | null;
}

const TITLE_MAX = 60;
const DESC_MAX = 160;

export function SeoEditor({ config, subdomain }: SeoEditorProps) {
  const [formData, setFormData] = useState({
    title: config.seo?.title ?? "",
    description: config.seo?.description ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Save to API
  const saveChanges = useCallback(async (seo: typeof formData) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seo }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      setLastSaved(new Date());
    } catch (err) {
      console.error("Failed to save SEO:", err);
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, []);

  function handleChange(key: keyof typeof formData, value: string) {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    saveChanges(updated);
  }

  const titleLength = formData.title.length;
  const descLength = formData.description.length;

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-warm-gray-500">
          Optimize how your portfolio appears in search results
        </p>
        <div className="flex items-center gap-2">
          {isSaving && <span className="text-warm-gray-500">Saving...</span>}
          {lastSaved && !isSaving && (
            <span className="text-green-600 flex items-center gap-1">
              <Check size={14} />
              Saved
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* SEO Preview */}
      <div className="p-4 bg-white border border-warm-gray-200 rounded-xl">
        <p className="text-xs text-warm-gray-500 mb-3">Search Result Preview</p>
        <div className="space-y-1">
          <h3 className="text-lg text-blue-700 hover:underline cursor-pointer truncate">
            {formData.title || `${subdomain}'s Portfolio | ugc.community`}
          </h3>
          <p className="text-sm text-green-700">
            ugc.community/creators/{subdomain ?? "your-subdomain"}
          </p>
          <p className="text-sm text-warm-gray-600 line-clamp-2">
            {formData.description ||
              "View my portfolio showcasing my best UGC creator work."}
          </p>
        </div>
      </div>

      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-warm-gray-700">
            Page Title
          </label>
          <span
            className={`text-xs ${
              titleLength > TITLE_MAX ? "text-red-500" : "text-warm-gray-400"
            }`}
          >
            {titleLength}/{TITLE_MAX}
          </span>
        </div>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder={`${subdomain}'s Portfolio | ugc.community`}
          maxLength={TITLE_MAX + 10} // Allow a bit over for editing
          className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
        />
        {titleLength > TITLE_MAX && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle size={12} />
            Title may be truncated in search results
          </p>
        )}
        <p className="mt-1 text-xs text-warm-gray-500">
          Leave blank to use default: &quot;[Name]&apos;s Portfolio | ugc.community&quot;
        </p>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-warm-gray-700">
            Meta Description
          </label>
          <span
            className={`text-xs ${
              descLength > DESC_MAX ? "text-red-500" : "text-warm-gray-400"
            }`}
          >
            {descLength}/{DESC_MAX}
          </span>
        </div>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="View my portfolio showcasing my best UGC creator work..."
          maxLength={DESC_MAX + 20}
          rows={3}
          className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50 resize-none"
        />
        {descLength > DESC_MAX && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle size={12} />
            Description may be truncated in search results
          </p>
        )}
        <p className="mt-1 text-xs text-warm-gray-500">
          Briefly describe what visitors will find in your portfolio
        </p>
      </div>

      {/* Tips */}
      <div className="p-4 bg-warm-gray-50 rounded-xl">
        <h4 className="font-medium text-warm-gray-900 mb-2">SEO Tips</h4>
        <ul className="space-y-1 text-sm text-warm-gray-600">
          <li>• Keep titles under 60 characters for best display</li>
          <li>• Use keywords naturally in your description</li>
          <li>• Descriptions should be compelling and describe your work</li>
          <li>• Update your SEO when you add new projects</li>
        </ul>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import type { SectionContent } from "@/lib/db/schema";

interface AboutFormProps {
  content: SectionContent | undefined;
  onChange: (content: SectionContent) => void;
}

export function AboutForm({ content, onChange }: AboutFormProps) {
  const [formData, setFormData] = useState({
    title: content?.title ?? "About Me",
    bio: content?.bio ?? "",
    stats: content?.stats ?? [],
  });

  function handleChange(key: keyof typeof formData, value: unknown) {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    onChange(updated as SectionContent);
  }

  function addStat() {
    const newStats = [...(formData.stats || []), { value: "", label: "" }];
    handleChange("stats", newStats);
  }

  function updateStat(index: number, field: string, value: string) {
    const newStats = [...(formData.stats || [])];
    newStats[index] = { ...newStats[index], [field]: value };
    handleChange("stats", newStats);
  }

  function removeStat(index: number) {
    const newStats = formData.stats?.filter((_, i) => i !== index) ?? [];
    handleChange("stats", newStats);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-warm-gray-700 mb-1">
          Section Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="About Me"
          className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-gray-700 mb-1">
          Bio / Description
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => handleChange("bio", e.target.value)}
          placeholder="Tell visitors about yourself..."
          rows={6}
          className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50 resize-none"
        />
        <p className="mt-1 text-xs text-warm-gray-500">
          Supports line breaks for paragraphs
        </p>
      </div>

      {/* Stats */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-warm-gray-700">
            Stats (optional)
          </label>
          <button
            type="button"
            onClick={addStat}
            className="flex items-center gap-1 text-sm text-coral hover:text-coral/80"
          >
            <Plus size={14} />
            Add Stat
          </button>
        </div>

        {formData.stats && formData.stats.length > 0 && (
          <div className="space-y-2">
            {formData.stats.map((stat, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-warm-gray-50 rounded-lg"
              >
                <GripVertical size={16} className="text-warm-gray-400" />
                <input
                  type="text"
                  value={stat.value}
                  onChange={(e) => updateStat(index, "value", e.target.value)}
                  placeholder="100+"
                  className="w-24 px-3 py-1.5 text-sm border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
                />
                <input
                  type="text"
                  value={stat.label}
                  onChange={(e) => updateStat(index, "label", e.target.value)}
                  placeholder="Projects Completed"
                  className="flex-1 px-3 py-1.5 text-sm border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
                />
                <button
                  type="button"
                  onClick={() => removeStat(index)}
                  className="p-1 text-warm-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

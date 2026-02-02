"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import {
  HeroForm,
  AboutForm,
  ServicesForm,
  TestimonialsForm,
  StatsForm,
  ContactForm,
} from "./forms";
import type { PortfolioConfig, Template, SectionContent } from "@/lib/db/schema";
import type { SectionType } from "@/lib/templates/types";

// Section metadata
const SECTION_META: Record<SectionType, { name: string; icon: string }> = {
  hero: { name: "Hero", icon: "🏠" },
  about: { name: "About", icon: "👤" },
  work: { name: "Work", icon: "💼" },
  services: { name: "Services", icon: "🛠️" },
  testimonials: { name: "Testimonials", icon: "💬" },
  stats: { name: "Stats", icon: "📊" },
  contact: { name: "Contact", icon: "✉️" },
};

interface ContentEditorProps {
  config: PortfolioConfig;
  template: Template;
  initialSection?: string;
}

export function ContentEditor({
  config,
  template,
  initialSection,
}: ContentEditorProps) {
  // Get section order
  const sectionOrder = (config.sections?.order ??
    template.sectionDefaults?.order ?? [
      "hero",
      "about",
      "work",
      "services",
      "testimonials",
      "stats",
      "contact",
    ]) as SectionType[];

  // Filter to only visible sections
  const visibleSections = sectionOrder.filter(
    (s) => config.sections?.[s]?.visible !== false
  );

  // State
  const [expandedSection, setExpandedSection] = useState<SectionType | null>(
    (initialSection as SectionType) ?? visibleSections[0] ?? null
  );
  const [sections, setSections] = useState(config.sections ?? {});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Save to API
  const saveChanges = useCallback(async (newSections: typeof sections) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio/sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: newSections }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      setLastSaved(new Date());
    } catch (err) {
      console.error("Failed to save:", err);
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Update section content
  function handleContentChange(sectionType: SectionType, content: SectionContent) {
    const newSections = {
      ...sections,
      [sectionType]: {
        ...sections[sectionType],
        content,
      },
    };
    setSections(newSections);
    saveChanges(newSections);
  }

  // Render form for a section
  function renderForm(sectionType: SectionType) {
    const content = sections[sectionType]?.content;

    switch (sectionType) {
      case "hero":
        return (
          <HeroForm
            content={content}
            onChange={(c) => handleContentChange("hero", c)}
          />
        );
      case "about":
        return (
          <AboutForm
            content={content}
            onChange={(c) => handleContentChange("about", c)}
          />
        );
      case "services":
        return (
          <ServicesForm
            content={content}
            onChange={(c) => handleContentChange("services", c)}
          />
        );
      case "testimonials":
        return (
          <TestimonialsForm
            content={content}
            onChange={(c) => handleContentChange("testimonials", c)}
          />
        );
      case "stats":
        return (
          <StatsForm
            content={content}
            onChange={(c) => handleContentChange("stats", c)}
          />
        );
      case "contact":
        return (
          <ContactForm
            content={content}
            onChange={(c) => handleContentChange("contact", c)}
          />
        );
      case "work":
        return (
          <div className="p-4 bg-warm-gray-50 rounded-lg text-center">
            <p className="text-warm-gray-600 mb-2">
              Work section pulls from your Projects
            </p>
            <a
              href="/dashboard/projects"
              className="text-coral hover:underline text-sm"
            >
              Manage Projects →
            </a>
          </div>
        );
      default:
        return (
          <p className="text-warm-gray-500">
            No form available for this section.
          </p>
        );
    }
  }

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-warm-gray-500">
          Click a section to edit its content. Changes save automatically.
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

      {/* Accordion sections */}
      <div className="space-y-2">
        {visibleSections.map((sectionType) => {
          const meta = SECTION_META[sectionType];
          const isExpanded = expandedSection === sectionType;

          return (
            <div
              key={sectionType}
              className="bg-white border border-warm-gray-200 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedSection(isExpanded ? null : sectionType)
                }
                className="w-full flex items-center justify-between p-4 hover:bg-warm-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{meta?.icon}</span>
                  <span className="font-medium text-warm-gray-900">
                    {meta?.name ?? sectionType}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp size={20} className="text-warm-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-warm-gray-400" />
                )}
              </button>

              {/* Form */}
              {isExpanded && (
                <div className="p-4 pt-0 border-t border-warm-gray-100">
                  {renderForm(sectionType)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {visibleSections.length === 0 && (
        <div className="text-center py-8">
          <p className="text-warm-gray-500">
            No sections visible. Go to Section Manager to enable sections.
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SectionItem } from "./section-item";
import type { PortfolioConfig, Template } from "@/lib/db/schema";
import type { SectionType } from "@/lib/templates/types";

// Section metadata
const SECTION_META: Record<SectionType, { name: string; description: string }> = {
  hero: { name: "Hero", description: "Large headline and call-to-action at the top" },
  about: { name: "About", description: "Introduction and personal story" },
  work: { name: "Work", description: "Portfolio projects gallery" },
  services: { name: "Services", description: "What you offer to clients" },
  testimonials: { name: "Testimonials", description: "Client reviews and feedback" },
  stats: { name: "Stats", description: "Key numbers and achievements" },
  contact: { name: "Contact", description: "Contact form and social links" },
};

// Available variants per section
const SECTION_VARIANTS: Record<SectionType, string[]> = {
  hero: ["centered", "split-left", "split-right", "video-bg", "minimal"],
  about: ["default", "centered", "with-stats", "timeline"],
  work: ["grid", "masonry", "carousel", "featured", "list"],
  services: ["cards", "list", "pricing", "icons"],
  testimonials: ["carousel", "grid", "featured", "marquee"],
  stats: ["inline", "cards", "large", "animated"],
  contact: ["simple", "form", "split", "cta"],
};

interface SectionManagerProps {
  config: PortfolioConfig;
  template: Template;
}

export function SectionManager({ config, template }: SectionManagerProps) {
  // Get available sections from template
  const availableSections = (template.availableSections ?? [
    "hero",
    "about",
    "work",
    "services",
    "testimonials",
    "stats",
    "contact",
  ]) as SectionType[];

  // Get current order from config or use default
  const initialOrder = (config.sections?.order ?? availableSections) as SectionType[];

  // State
  const [sectionOrder, setSectionOrder] = useState<SectionType[]>(initialOrder);
  const [sections, setSections] = useState<PortfolioConfig["sections"]>(
    config.sections ?? {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Save to API
  const saveChanges = useCallback(
    async (newOrder: SectionType[], newSections: typeof sections) => {
      setIsSaving(true);
      setError(null);

      try {
        const response = await fetch("/api/portfolio/sections", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sections: {
              ...newSections,
              order: newOrder,
            },
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to save");
        }

        setLastSaved(new Date());
        // Dispatch event to refresh preview
        window.dispatchEvent(new CustomEvent("portfolio-updated"));
      } catch (err) {
        console.error("Failed to save:", err);
        setError(err instanceof Error ? err.message : "Failed to save changes");
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder.indexOf(active.id as SectionType);
      const newIndex = sectionOrder.indexOf(over.id as SectionType);
      const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
      setSectionOrder(newOrder);
      saveChanges(newOrder, sections);
    }
  }

  // Toggle visibility
  function handleToggleVisibility(sectionType: SectionType) {
    const currentConfig = sections[sectionType] ?? {};
    const newVisible = currentConfig.visible !== false ? false : true;

    const newSections = {
      ...sections,
      [sectionType]: {
        ...currentConfig,
        visible: newVisible,
      },
    };

    setSections(newSections);
    saveChanges(sectionOrder, newSections);
  }

  // Change variant
  function handleChangeVariant(sectionType: SectionType, variant: string) {
    const currentConfig = sections[sectionType] ?? {};

    const newSections = {
      ...sections,
      [sectionType]: {
        ...currentConfig,
        variant,
      },
    };

    setSections(newSections);
    saveChanges(sectionOrder, newSections);
  }

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-warm-gray-500">
          Drag sections to reorder. Toggle visibility with the eye icon.
        </p>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-warm-gray-500">Saving...</span>
          )}
          {lastSaved && !isSaving && (
            <span className="text-green-600">
              ✓ Saved at {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Sortable sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sectionOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sectionOrder.map((sectionType) => {
              const meta = SECTION_META[sectionType];
              const sectionConfig = sections[sectionType];
              const isVisible = sectionConfig?.visible !== false;
              const currentVariant = sectionConfig?.variant ?? SECTION_VARIANTS[sectionType][0];
              const variants = SECTION_VARIANTS[sectionType];

              return (
                <SectionItem
                  key={sectionType}
                  id={sectionType}
                  name={meta?.name ?? sectionType}
                  description={meta?.description ?? ""}
                  isVisible={isVisible}
                  variants={variants}
                  currentVariant={currentVariant}
                  onToggleVisibility={() => handleToggleVisibility(sectionType)}
                  onChangeVariant={(v) => handleChangeVariant(sectionType, v)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add section hint */}
      {availableSections.filter((s) => !sectionOrder.includes(s)).length > 0 && (
        <div className="mt-4 p-4 bg-warm-gray-50 rounded-lg">
          <p className="text-sm text-warm-gray-600">
            <strong>Available sections not in use:</strong>{" "}
            {availableSections
              .filter((s) => !sectionOrder.includes(s))
              .map((s) => SECTION_META[s]?.name ?? s)
              .join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}

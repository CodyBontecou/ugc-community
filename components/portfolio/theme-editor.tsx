"use client";

import { useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { ColorPicker } from "./color-picker";
import { FontSelector } from "./font-selector";
import type { PortfolioConfig, Template } from "@/lib/db/schema";
import { resolveThemeFromTemplate } from "@/lib/templates/registry";

interface ThemeEditorProps {
  config: PortfolioConfig;
  template: Template;
}

// Spacing options
const SPACING_OPTIONS = {
  sectionGap: [
    { value: "compact", label: "Compact" },
    { value: "normal", label: "Normal" },
    { value: "spacious", label: "Spacious" },
  ],
  contentWidth: [
    { value: "narrow", label: "Narrow (768px)" },
    { value: "normal", label: "Normal (1024px)" },
    { value: "wide", label: "Wide (1280px)" },
    { value: "full", label: "Full Width" },
  ],
};

// Effect options
const EFFECT_OPTIONS = {
  borderRadius: [
    { value: "none", label: "None" },
    { value: "subtle", label: "Subtle" },
    { value: "rounded", label: "Rounded" },
    { value: "pill", label: "Pill" },
  ],
  shadows: [
    { value: "none", label: "None" },
    { value: "subtle", label: "Subtle" },
    { value: "medium", label: "Medium" },
    { value: "dramatic", label: "Dramatic" },
  ],
};

// Type scale options
const SCALE_OPTIONS = [
  { value: 1.125, label: "Minor Second (1.125)" },
  { value: 1.2, label: "Minor Third (1.2)" },
  { value: 1.25, label: "Major Third (1.25)" },
  { value: 1.333, label: "Perfect Fourth (1.333)" },
  { value: 1.5, label: "Perfect Fifth (1.5)" },
];

export function ThemeEditor({ config, template }: ThemeEditorProps) {
  // Get resolved theme (merges template defaults with user overrides)
  const defaultTheme = resolveThemeFromTemplate(template, {});
  const currentTheme = resolveThemeFromTemplate(template, config.theme);

  // Local state for editing
  const [theme, setTheme] = useState(config.theme ?? {});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Save to API
  const saveTheme = useCallback(async (newTheme: typeof theme) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      setLastSaved(new Date());
      // Dispatch event to refresh preview
      window.dispatchEvent(new CustomEvent("portfolio-updated"));
    } catch (err) {
      console.error("Failed to save theme:", err);
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Update a specific theme property
  function updateTheme(
    section: "colors" | "typography" | "spacing" | "effects",
    key: string,
    value: unknown
  ) {
    const newTheme: Record<string, unknown> = {
      ...theme,
      [section]: {
        ...((theme as Record<string, unknown>)[section] as Record<string, unknown> ?? {}),
        [key]: value,
      },
    };
    setTheme(newTheme as typeof theme);
    saveTheme(newTheme as typeof theme);
  }

  // Update nested color
  function updateColor(key: string, value: string) {
    const currentColors = ((theme as Record<string, unknown>).colors ?? {}) as Record<string, unknown>;
    const newTheme: Record<string, unknown> = {
      ...theme,
      colors: {
        ...currentColors,
        [key]: value,
      },
    };
    setTheme(newTheme as typeof theme);
    saveTheme(newTheme as typeof theme);
  }

  // Update nested text color
  function updateTextColor(key: string, value: string) {
    const currentColors = ((theme as Record<string, unknown>).colors ?? {}) as Record<string, unknown>;
    const currentText = (currentColors.text ?? {}) as Record<string, string>;
    
    const newTheme: Record<string, unknown> = {
      ...theme,
      colors: {
        ...currentColors,
        text: {
          ...currentText,
          [key]: value,
        },
      },
    };
    setTheme(newTheme as typeof theme);
    saveTheme(newTheme as typeof theme);
  }

  // Reset to template defaults
  function handleReset() {
    if (confirm("Reset all theme settings to template defaults?")) {
      setTheme({});
      saveTheme({});
    }
  }

  return (
    <div className="space-y-8">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {isSaving && <span className="text-warm-gray-500">Saving...</span>}
          {lastSaved && !isSaving && (
            <span className="text-green-600">
              ✓ Saved at {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-warm-gray-600 hover:text-warm-gray-900 hover:bg-warm-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw size={14} />
          Reset to Defaults
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Colors Section */}
      <section>
        <h2 className="text-lg font-semibold text-warm-gray-900 mb-4">Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-white rounded-xl border border-warm-gray-200">
          <ColorPicker
            label="Primary"
            value={currentTheme.colors.primary}
            onChange={(v) => updateColor("primary", v)}
          />
          <ColorPicker
            label="Secondary"
            value={currentTheme.colors.secondary}
            onChange={(v) => updateColor("secondary", v)}
          />
          <ColorPicker
            label="Accent"
            value={currentTheme.colors.accent}
            onChange={(v) => updateColor("accent", v)}
          />
          <ColorPicker
            label="Background"
            value={currentTheme.colors.background}
            onChange={(v) => updateColor("background", v)}
          />
          <ColorPicker
            label="Surface"
            value={currentTheme.colors.surface}
            onChange={(v) => updateColor("surface", v)}
          />
          <ColorPicker
            label="Border"
            value={currentTheme.colors.border}
            onChange={(v) => updateColor("border", v)}
          />
        </div>

        {/* Text colors */}
        <div className="mt-4 grid grid-cols-3 gap-4 p-4 bg-white rounded-xl border border-warm-gray-200">
          <ColorPicker
            label="Text Primary"
            value={currentTheme.colors.text.primary}
            onChange={(v) => updateTextColor("primary", v)}
          />
          <ColorPicker
            label="Text Secondary"
            value={currentTheme.colors.text.secondary}
            onChange={(v) => updateTextColor("secondary", v)}
          />
          <ColorPicker
            label="Text Inverse"
            value={currentTheme.colors.text.inverse}
            onChange={(v) => updateTextColor("inverse", v)}
          />
        </div>
      </section>

      {/* Typography Section */}
      <section>
        <h2 className="text-lg font-semibold text-warm-gray-900 mb-4">
          Typography
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-xl border border-warm-gray-200">
          <FontSelector
            label="Heading Font"
            value={currentTheme.typography.headingFont}
            onChange={(v) => updateTheme("typography", "headingFont", v)}
          />
          <FontSelector
            label="Body Font"
            value={currentTheme.typography.bodyFont}
            onChange={(v) => updateTheme("typography", "bodyFont", v)}
          />

          {/* Base size slider */}
          <div>
            <label className="block text-sm font-medium text-warm-gray-700 mb-1">
              Base Size: {currentTheme.typography.baseSize}px
            </label>
            <input
              type="range"
              min={14}
              max={20}
              step={1}
              value={currentTheme.typography.baseSize}
              onChange={(e) =>
                updateTheme("typography", "baseSize", parseInt(e.target.value))
              }
              className="w-full h-2 bg-warm-gray-200 rounded-lg appearance-none cursor-pointer accent-coral"
            />
            <div className="flex justify-between text-xs text-warm-gray-400 mt-1">
              <span>14px</span>
              <span>20px</span>
            </div>
          </div>

          {/* Type scale */}
          <div>
            <label className="block text-sm font-medium text-warm-gray-700 mb-1">
              Type Scale
            </label>
            <select
              value={currentTheme.typography.scale}
              onChange={(e) =>
                updateTheme("typography", "scale", parseFloat(e.target.value))
              }
              className="w-full px-3 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
            >
              {SCALE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Spacing Section */}
      <section>
        <h2 className="text-lg font-semibold text-warm-gray-900 mb-4">
          Spacing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-xl border border-warm-gray-200">
          <div>
            <label className="block text-sm font-medium text-warm-gray-700 mb-2">
              Section Gap
            </label>
            <div className="flex gap-2">
              {SPACING_OPTIONS.sectionGap.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateTheme("spacing", "sectionGap", opt.value)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    currentTheme.spacing.sectionGap === opt.value
                      ? "border-coral bg-coral/10 text-coral"
                      : "border-warm-gray-200 text-warm-gray-700 hover:border-warm-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-gray-700 mb-2">
              Content Width
            </label>
            <select
              value={currentTheme.spacing.contentWidth}
              onChange={(e) =>
                updateTheme("spacing", "contentWidth", e.target.value)
              }
              className="w-full px-3 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
            >
              {SPACING_OPTIONS.contentWidth.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Effects Section */}
      <section>
        <h2 className="text-lg font-semibold text-warm-gray-900 mb-4">
          Effects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-xl border border-warm-gray-200">
          <div>
            <label className="block text-sm font-medium text-warm-gray-700 mb-2">
              Border Radius
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EFFECT_OPTIONS.borderRadius.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateTheme("effects", "borderRadius", opt.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    currentTheme.effects.borderRadius === opt.value
                      ? "border-coral bg-coral/10 text-coral"
                      : "border-warm-gray-200 text-warm-gray-700 hover:border-warm-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-gray-700 mb-2">
              Shadows
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EFFECT_OPTIONS.shadows.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateTheme("effects", "shadows", opt.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    currentTheme.effects.shadows === opt.value
                      ? "border-coral bg-coral/10 text-coral"
                      : "border-warm-gray-200 text-warm-gray-700 hover:border-warm-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Animations toggle */}
          <div className="col-span-full">
            <label className="flex items-center justify-between p-3 bg-warm-gray-50 rounded-lg cursor-pointer">
              <span className="text-sm font-medium text-warm-gray-700">
                Enable Animations
              </span>
              <button
                onClick={() =>
                  updateTheme("effects", "animations", !currentTheme.effects.animations)
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  currentTheme.effects.animations
                    ? "bg-coral"
                    : "bg-warm-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    currentTheme.effects.animations ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}

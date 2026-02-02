"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShadowSettings, SHADOW_PRESETS } from "@/lib/editor/design-system";
import { Input } from "@/components/ui/input";

interface ShadowsPanelProps {
  shadows: ShadowSettings;
  onShadowsChange: (shadows: ShadowSettings) => void;
  onBack: () => void;
}

const COLOR_OPTIONS = [
  { value: "default", label: "Default", color: "#000000" },
  { value: "primary", label: "Primary", color: "var(--primary)" },
  { value: "secondary", label: "Secondary", color: "var(--secondary)" },
  { value: "accent", label: "Accent", color: "var(--accent)" },
];

export function ShadowsPanel({
  shadows,
  onShadowsChange,
  onBack,
}: ShadowsPanelProps) {
  const updateShadow = (key: keyof ShadowSettings, value: number | string) => {
    onShadowsChange({
      ...shadows,
      preset: "none" as const, // Custom when manually adjusted
      [key]: value,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-foreground font-medium">Shadows</span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* X Offset */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-muted-foreground">X Offset</label>
            <div className="flex items-center gap-2">
              <Slider
                value={[shadows.xOffset]}
                min={-20}
                max={20}
                step={1}
                onValueChange={([value]) => updateShadow("xOffset", value)}
                className="w-40"
              />
              <Input
                type="number"
                value={shadows.xOffset}
                onChange={(e) => updateShadow("xOffset", parseInt(e.target.value) || 0)}
                className="w-16 h-8 text-center bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        {/* Y Offset */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-muted-foreground">Y Offset</label>
            <div className="flex items-center gap-2">
              <Slider
                value={[shadows.yOffset]}
                min={-20}
                max={20}
                step={1}
                onValueChange={([value]) => updateShadow("yOffset", value)}
                className="w-40"
              />
              <Input
                type="number"
                value={shadows.yOffset}
                onChange={(e) => updateShadow("yOffset", parseInt(e.target.value) || 0)}
                className="w-16 h-8 text-center bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        {/* Blur */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-muted-foreground">Blur</label>
            <div className="flex items-center gap-2">
              <Slider
                value={[shadows.blur]}
                min={0}
                max={50}
                step={1}
                onValueChange={([value]) => updateShadow("blur", value)}
                className="w-40"
              />
              <Input
                type="number"
                value={shadows.blur}
                onChange={(e) => updateShadow("blur", parseInt(e.target.value) || 0)}
                className="w-16 h-8 text-center bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        {/* Spread */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-muted-foreground">Spread</label>
            <div className="flex items-center gap-2">
              <Slider
                value={[shadows.spread]}
                min={-20}
                max={20}
                step={1}
                onValueChange={([value]) => updateShadow("spread", value)}
                className="w-40"
              />
              <Input
                type="number"
                value={shadows.spread}
                onChange={(e) => updateShadow("spread", parseInt(e.target.value) || 0)}
                className="w-16 h-8 text-center bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        {/* Opacity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-muted-foreground">Opacity</label>
            <div className="flex items-center gap-2">
              <Slider
                value={[shadows.opacity * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={([value]) => updateShadow("opacity", value / 100)}
                className="w-40"
              />
              <Input
                type="number"
                value={Math.round(shadows.opacity * 100)}
                onChange={(e) => updateShadow("opacity", (parseInt(e.target.value) || 0) / 100)}
                className="w-16 h-8 text-center bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Color</label>
          <Select
            value={shadows.color === "#000000" ? "default" : shadows.color}
            onValueChange={(value) => {
              const colorOption = COLOR_OPTIONS.find((c) => c.value === value);
              updateShadow("color", colorOption?.color || value);
            }}
          >
            <SelectTrigger className="w-full bg-secondary border-border">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded border border-border bg-[repeating-conic-gradient(#808080_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]"
                  style={{
                    backgroundColor:
                      shadows.color === "default" ? "#000000" : shadows.color,
                  }}
                />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {COLOR_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-border"
                      style={{ backgroundColor: option.color }}
                    />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        <div className="pt-4">
          <label className="text-sm text-muted-foreground mb-3 block">Preview</label>
          <div className="p-8 bg-secondary/50 rounded-lg flex items-center justify-center">
            <div
              className="w-24 h-24 bg-background rounded-lg"
              style={{
                boxShadow:
                  shadows.preset === "none"
                    ? "none"
                    : `${shadows.xOffset}px ${shadows.yOffset}px ${shadows.blur}px ${shadows.spread}px rgba(0,0,0,${shadows.opacity})`,
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Settings2, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ColorScheme, COLOR_SCHEMES } from "@/lib/editor/design-system";

interface ColorsPanelProps {
  colorScheme: ColorScheme;
  onColorSchemeChange: (scheme: ColorScheme) => void;
  onBack: () => void;
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  const [localValue, setLocalValue] = useState(value);

  return (
    <div className="flex items-center gap-2 p-2 bg-[#1f1f1f] rounded-lg border border-[#333]">
      <div
        className="w-6 h-6 rounded border border-border shrink-0"
        style={{ backgroundColor: value }}
      />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => onChange(localValue)}
        className="flex-1 bg-transparent text-sm text-white outline-none"
      />
      <ChevronDown size={14} className="text-muted-foreground" />
    </div>
  );
}

export function ColorsPanel({
  colorScheme,
  onColorSchemeChange,
  onBack,
}: ColorsPanelProps) {
  const [showSchemeDropdown, setShowSchemeDropdown] = useState(false);

  const updateColor = (key: keyof ColorScheme["colors"], value: string) => {
    onColorSchemeChange({
      ...colorScheme,
      colors: {
        ...colorScheme.colors,
        [key]: value,
      },
    });
  };

  const colorGroups = [
    {
      title: "Primary",
      colors: [
        { key: "primary", label: "Primary" },
        { key: "primaryForeground", label: "Primary Foreground" },
      ],
    },
    {
      title: "Secondary",
      colors: [
        { key: "secondary", label: "Secondary" },
        { key: "secondaryForeground", label: "Secondary Foreground" },
      ],
    },
    {
      title: "Accent",
      colors: [
        { key: "accent", label: "Accent" },
        { key: "accentForeground", label: "Accent Foreground" },
      ],
    },
    {
      title: "Base",
      colors: [
        { key: "background", label: "Background" },
        { key: "foreground", label: "Foreground" },
      ],
    },
    {
      title: "Card",
      colors: [
        { key: "card", label: "Card" },
        { key: "cardForeground", label: "Card Foreground" },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-foreground font-medium">Colors</span>
          </div>
          <Popover open={showSchemeDropdown} onOpenChange={setShowSchemeDropdown}>
            <PopoverTrigger asChild>
              <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Settings2 size={16} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 p-0 bg-popover border-border"
            >
              <div className="p-2">
                <p className="text-xs text-muted-foreground px-2 py-1 mb-1">
                  Color Schemes
                </p>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {COLOR_SCHEMES.map((scheme) => (
                    <button
                      key={scheme.id}
                      onClick={() => {
                        onColorSchemeChange(scheme);
                        setShowSchemeDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors ${
                        colorScheme.id === scheme.id ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex gap-0.5 rounded overflow-hidden">
                        <div
                          className="w-5 h-8"
                          style={{ backgroundColor: scheme.colors.background }}
                        />
                        <div
                          className="w-5 h-8"
                          style={{ backgroundColor: scheme.colors.secondary }}
                        />
                        <div
                          className="w-5 h-8"
                          style={{ backgroundColor: scheme.colors.muted }}
                        />
                        <div
                          className="w-5 h-8"
                          style={{ backgroundColor: scheme.colors.primary }}
                        />
                        <div
                          className="w-5 h-8"
                          style={{ backgroundColor: scheme.colors.accent }}
                        />
                      </div>
                      <span className="text-sm text-foreground">{scheme.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Color Scheme Preview */}
      <div className="p-4 border-b border-border">
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full">
              <div className="flex gap-0.5 rounded-md overflow-hidden">
                <div
                  className="h-12 flex-1"
                  style={{ backgroundColor: colorScheme.colors.background }}
                />
                <div
                  className="h-12 flex-1"
                  style={{ backgroundColor: colorScheme.colors.secondary }}
                />
                <div
                  className="h-12 flex-1"
                  style={{ backgroundColor: colorScheme.colors.muted }}
                />
                <div
                  className="h-12 flex-1"
                  style={{ backgroundColor: colorScheme.colors.primary }}
                />
                <div
                  className="h-12 flex-1"
                  style={{ backgroundColor: colorScheme.colors.accent }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-foreground">{colorScheme.name}</span>
                <ChevronDown size={14} className="text-muted-foreground" />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2 bg-popover border-border">
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.id}
                  onClick={() => onColorSchemeChange(scheme)}
                  className={`w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors ${
                    colorScheme.id === scheme.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex gap-0.5 rounded overflow-hidden">
                    <div
                      className="w-5 h-8"
                      style={{ backgroundColor: scheme.colors.background }}
                    />
                    <div
                      className="w-5 h-8"
                      style={{ backgroundColor: scheme.colors.secondary }}
                    />
                    <div
                      className="w-5 h-8"
                      style={{ backgroundColor: scheme.colors.muted }}
                    />
                    <div
                      className="w-5 h-8"
                      style={{ backgroundColor: scheme.colors.primary }}
                    />
                    <div
                      className="w-5 h-8"
                      style={{ backgroundColor: scheme.colors.accent }}
                    />
                  </div>
                  <span className="text-sm text-foreground">{scheme.name}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Color Groups */}
      <div className="p-4 space-y-6">
        {colorGroups.map((group) => (
          <div key={group.title}>
            <h4 className="text-sm font-medium text-foreground mb-3">
              {group.title}
            </h4>
            <div className="space-y-2">
              {group.colors.map((color) => (
                <ColorInput
                  key={color.key}
                  label={color.label}
                  value={colorScheme.colors[color.key as keyof ColorScheme["colors"]]}
                  onChange={(value) =>
                    updateColor(color.key as keyof ColorScheme["colors"], value)
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

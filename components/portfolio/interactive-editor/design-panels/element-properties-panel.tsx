"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Settings2,
  MoreHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Italic,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DesignSystem, TYPOGRAPHY_OPTIONS } from "@/lib/editor/design-system";
import type { SelectedElement } from "@/lib/editor/types";
import { getElementTypeName } from "@/lib/editor/html-element-selector";

interface ElementPropertiesPanelProps {
  selectedElement: SelectedElement;
  designSystem: DesignSystem;
  onStyleChange: (styles: Record<string, string>) => void;
  onContentChange: (content: string) => void;
  onDeselect: () => void;
}

const FONT_WEIGHTS = [
  { value: "100", label: "Thin" },
  { value: "200", label: "Extra Light" },
  { value: "300", label: "Light" },
  { value: "400", label: "Normal" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semi Bold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra Bold" },
  { value: "900", label: "Black" },
];

const FONT_SIZES = [
  { value: "0.75rem", label: "xs" },
  { value: "0.875rem", label: "sm" },
  { value: "1rem", label: "base" },
  { value: "1.125rem", label: "lg" },
  { value: "1.25rem", label: "xl" },
  { value: "1.5rem", label: "2xl" },
  { value: "1.875rem", label: "3xl" },
  { value: "2.25rem", label: "4xl" },
  { value: "3rem", label: "5xl" },
];

const COLOR_OPTIONS = [
  { value: "inherit", label: "Default" },
  { value: "var(--foreground)", label: "foreground" },
  { value: "var(--muted-foreground)", label: "muted-foreground" },
  { value: "var(--primary)", label: "primary" },
  { value: "var(--secondary)", label: "secondary" },
  { value: "var(--accent)", label: "accent" },
];

const BACKGROUND_OPTIONS = [
  { value: "transparent", label: "Default" },
  { value: "var(--background)", label: "background" },
  { value: "var(--card)", label: "card" },
  { value: "var(--muted)", label: "muted" },
  { value: "var(--primary)", label: "primary" },
  { value: "var(--secondary)", label: "secondary" },
  { value: "var(--accent)", label: "accent" },
];

export function ElementPropertiesPanel({
  selectedElement,
  designSystem,
  onStyleChange,
  onContentChange,
  onDeselect,
}: ElementPropertiesPanelProps) {
  const [content, setContent] = useState(selectedElement.content || "");
  const [typography, setTypography] = useState({
    fontFamily: "Default",
    fontWeight: "400",
    fontSize: "1rem",
    lineHeight: "1.75rem",
    letterSpacing: "0.1em",
    textAlign: "left" as "left" | "center" | "right" | "justify",
    textDecoration: "none" as "none" | "underline" | "line-through" | "overline",
    fontStyle: "normal" as "normal" | "italic",
  });
  const [color, setColor] = useState("var(--muted-foreground)");
  const [background, setBackground] = useState("transparent");
  const [margin, setMargin] = useState({ top: "0", right: "0", bottom: "0", left: "0" });

  // Update content when element changes
  useEffect(() => {
    setContent(selectedElement.content || "");
  }, [selectedElement]);

  const handleTypographyChange = (key: string, value: string) => {
    const newTypography = { ...typography, [key]: value };
    setTypography(newTypography);
    onStyleChange({
      fontWeight: newTypography.fontWeight,
      fontSize: newTypography.fontSize,
      lineHeight: newTypography.lineHeight,
      letterSpacing: newTypography.letterSpacing,
      textAlign: newTypography.textAlign,
      textDecoration: newTypography.textDecoration,
      fontStyle: newTypography.fontStyle,
    });
  };

  const handleColorChange = (value: string) => {
    setColor(value);
    onStyleChange({ color: value });
  };

  const handleBackgroundChange = (value: string) => {
    setBackground(value);
    onStyleChange({ backgroundColor: value });
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onContentChange(newContent);
  };

  const toggleDecoration = (decoration: string) => {
    if (decoration === "italic") {
      const newStyle = typography.fontStyle === "italic" ? "normal" : "italic";
      handleTypographyChange("fontStyle", newStyle);
    } else {
      const current = typography.textDecoration;
      const newDecoration = current === decoration ? "none" : decoration;
      handleTypographyChange("textDecoration", newDecoration);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-blue-600/20 rounded text-blue-400 text-xs font-medium flex items-center gap-1">
              <Settings2 size={12} />
              Page
            </div>
            <span className="text-muted-foreground">/</span>
            <div className="px-2 py-1 bg-blue-600 rounded text-white text-xs font-medium flex items-center gap-1">
              ◇ {selectedElement.tagName.toLowerCase()}
            </div>
          </div>
          <button
            onClick={onDeselect}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Content */}
        <div>
          <label className="text-sm text-foreground mb-2 block">Content</label>
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="min-h-[80px] bg-[#1f1f1f] border-[#333] text-white resize-none"
            placeholder="Element content..."
          />
        </div>

        {/* Typography */}
        <div>
          <label className="text-sm text-foreground mb-3 block">Typography</label>
          <div className="space-y-3">
            {/* Font Family */}
            <Select
              value={typography.fontFamily}
              onValueChange={(value) => handleTypographyChange("fontFamily", value)}
            >
              <SelectTrigger className="w-full bg-[#1f1f1f] border-[#333] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Default">Default</SelectItem>
                <SelectItem value="sans">Sans</SelectItem>
                <SelectItem value="serif">Serif</SelectItem>
                <SelectItem value="mono">Mono</SelectItem>
              </SelectContent>
            </Select>

            {/* Weight and Size */}
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={typography.fontWeight}
                onValueChange={(value) => handleTypographyChange("fontWeight", value)}
              >
                <SelectTrigger className="bg-[#1f1f1f] border-[#333] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHTS.map((weight) => (
                    <SelectItem key={weight.value} value={weight.value}>
                      {weight.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={typography.fontSize}
                onValueChange={(value) => handleTypographyChange("fontSize", value)}
              >
                <SelectTrigger className="bg-[#1f1f1f] border-[#333] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Line Height and Letter Spacing */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Line Height
                </label>
                <Input
                  value={typography.lineHeight}
                  onChange={(e) => handleTypographyChange("lineHeight", e.target.value)}
                  className="bg-[#1f1f1f] border-[#333] text-white"
                  placeholder="1.75rem"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Letter Spacing
                </label>
                <Input
                  value={typography.letterSpacing}
                  onChange={(e) => handleTypographyChange("letterSpacing", e.target.value)}
                  className="bg-[#1f1f1f] border-[#333] text-white"
                  placeholder="0.1em"
                />
              </div>
            </div>

            {/* Alignment */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Alignment
                </label>
                <div className="flex border border-border rounded-md overflow-hidden">
                  <button
                    onClick={() => handleTypographyChange("textAlign", "left")}
                    className={`flex-1 p-2 transition-colors ${
                      typography.textAlign === "left"
                        ? "bg-blue-600 text-white"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Undo2 size={14} className="mx-auto rotate-90" />
                  </button>
                  <button
                    onClick={() => handleTypographyChange("textAlign", "left")}
                    className={`flex-1 p-2 transition-colors ${
                      typography.textAlign === "left"
                        ? "bg-secondary text-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <AlignLeft size={14} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleTypographyChange("textAlign", "center")}
                    className={`flex-1 p-2 transition-colors ${
                      typography.textAlign === "center"
                        ? "bg-secondary text-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <AlignCenter size={14} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleTypographyChange("textAlign", "right")}
                    className={`flex-1 p-2 transition-colors ${
                      typography.textAlign === "right"
                        ? "bg-secondary text-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <AlignRight size={14} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleTypographyChange("textAlign", "justify")}
                    className={`flex-1 p-2 transition-colors ${
                      typography.textAlign === "justify"
                        ? "bg-secondary text-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <AlignJustify size={14} className="mx-auto" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Decoration
                </label>
                <div className="flex border border-border rounded-md overflow-hidden">
                  <button
                    onClick={() => toggleDecoration("italic")}
                    className={`flex-1 p-2 transition-colors ${
                      typography.fontStyle === "italic"
                        ? "bg-secondary text-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Italic size={14} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => toggleDecoration("line-through")}
                    className={`flex-1 p-2 transition-colors ${
                      typography.textDecoration === "line-through"
                        ? "bg-secondary text-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Strikethrough size={14} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => toggleDecoration("underline")}
                    className={`flex-1 p-2 transition-colors ${
                      typography.textDecoration === "underline"
                        ? "bg-secondary text-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Underline size={14} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => toggleDecoration("overline")}
                    className="flex-1 p-2 bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="text-xs">ō</span>
                  </button>
                  <button
                    onClick={() => handleTypographyChange("textDecoration", "none")}
                    className="flex-1 p-2 bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="text-xs">∅</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-sm text-foreground mb-2 block">Color</label>
          <Select value={color} onValueChange={handleColorChange}>
            <SelectTrigger className="w-full bg-[#1f1f1f] border-[#333] text-white">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border border-border"
                  style={{ backgroundColor: color.includes("var") ? "#888" : color }}
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
                      style={{
                        backgroundColor: option.value.includes("var") ? "#888" : option.value,
                      }}
                    />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Background */}
        <div>
          <label className="text-sm text-foreground mb-2 block">Background</label>
          <Select value={background} onValueChange={handleBackgroundChange}>
            <SelectTrigger className="w-full bg-[#1f1f1f] border-[#333] text-white">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border border-border bg-[repeating-conic-gradient(#808080_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]"
                  style={{
                    backgroundColor: background === "transparent" ? undefined : background,
                  }}
                />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {BACKGROUND_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-border bg-[repeating-conic-gradient(#808080_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]"
                      style={{
                        backgroundColor:
                          option.value === "transparent" ? undefined : option.value,
                      }}
                    />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Layout */}
        <div>
          <label className="text-sm text-foreground mb-2 block">Layout</label>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Margin</label>
            <div className="grid grid-cols-4 gap-2">
              <Input
                value={margin.top}
                onChange={(e) => setMargin({ ...margin, top: e.target.value })}
                placeholder="T"
                className="bg-[#1f1f1f] border-[#333] text-white text-center"
              />
              <Input
                value={margin.right}
                onChange={(e) => setMargin({ ...margin, right: e.target.value })}
                placeholder="R"
                className="bg-[#1f1f1f] border-[#333] text-white text-center"
              />
              <Input
                value={margin.bottom}
                onChange={(e) => setMargin({ ...margin, bottom: e.target.value })}
                placeholder="B"
                className="bg-[#1f1f1f] border-[#333] text-white text-center"
              />
              <Input
                value={margin.left}
                onChange={(e) => setMargin({ ...margin, left: e.target.value })}
                placeholder="L"
                className="bg-[#1f1f1f] border-[#333] text-white text-center"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

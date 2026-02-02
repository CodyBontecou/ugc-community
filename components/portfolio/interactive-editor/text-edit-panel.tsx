"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  X,
  Type,
  Palette,
  ALargeSmall,
  RotateCcw,
} from "lucide-react";
import type { SelectedElement } from "@/lib/editor/types";
import { getElementTypeName } from "@/lib/editor/html-element-selector";

interface TextEditPanelProps {
  selectedElement: SelectedElement;
  onApplyEdit: (newOuterHtml: string, isOuterHtml: boolean) => void;
  onLiveUpdate?: (newOuterHtml: string) => void;
  onClose: () => void;
}

// Common web-safe fonts + popular Google fonts
const FONT_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Lato", value: "Lato, sans-serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "Source Code Pro", value: "'Source Code Pro', monospace" },
  { label: "Courier New", value: "'Courier New', monospace" },
];

// Common font sizes
const FONT_SIZE_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Extra Small (12px)", value: "12px" },
  { label: "Small (14px)", value: "14px" },
  { label: "Normal (16px)", value: "16px" },
  { label: "Medium (18px)", value: "18px" },
  { label: "Large (20px)", value: "20px" },
  { label: "Extra Large (24px)", value: "24px" },
  { label: "2XL (30px)", value: "30px" },
  { label: "3XL (36px)", value: "36px" },
  { label: "4XL (48px)", value: "48px" },
  { label: "5XL (60px)", value: "60px" },
  { label: "6XL (72px)", value: "72px" },
];

// Preset colors
const COLOR_PRESETS = [
  "#000000", // Black
  "#FFFFFF", // White
  "#374151", // Gray-700
  "#6B7280", // Gray-500
  "#9CA3AF", // Gray-400
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#84CC16", // Lime
  "#22C55E", // Green
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#F43F5E", // Rose
];

function parseCurrentStyles(outerHtml: string): {
  fontFamily: string;
  fontSize: string;
  color: string;
  textContent: string;
} {
  if (typeof DOMParser === "undefined") {
    return { fontFamily: "", fontSize: "", color: "", textContent: "" };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(outerHtml, "text/html");
  const element = doc.body.firstElementChild as HTMLElement;

  if (!element) {
    return { fontFamily: "", fontSize: "", color: "", textContent: "" };
  }

  // Extract inline styles
  const style = element.style;
  const fontFamily = style.fontFamily || "";
  const fontSize = style.fontSize || "";
  const color = style.color || "";
  const textContent = element.textContent || "";

  return { fontFamily, fontSize, color, textContent };
}

function rgbToHex(rgb: string): string {
  // Handle rgb(r, g, b) format
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, "0");
    const g = parseInt(match[2]).toString(16).padStart(2, "0");
    const b = parseInt(match[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`.toUpperCase();
  }
  return rgb;
}

function buildOuterHtml(
  originalOuterHtml: string,
  textContent: string,
  fontFamily: string,
  fontSize: string,
  color: string
): string | null {
  if (typeof DOMParser === "undefined") return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(originalOuterHtml, "text/html");
  const element = doc.body.firstElementChild as HTMLElement;

  if (!element) return null;

  // Update text content
  element.textContent = textContent;

  // Update styles
  if (fontFamily) {
    element.style.fontFamily = fontFamily;
  } else {
    element.style.removeProperty("font-family");
  }

  if (fontSize) {
    element.style.fontSize = fontSize;
  } else {
    element.style.removeProperty("font-size");
  }

  if (color) {
    element.style.color = color;
  } else {
    element.style.removeProperty("color");
  }

  // Clean up empty style attribute
  if (element.getAttribute("style") === "") {
    element.removeAttribute("style");
  }

  return element.outerHTML;
}

export function TextEditPanel({
  selectedElement,
  onApplyEdit,
  onLiveUpdate,
  onClose,
}: TextEditPanelProps) {
  // Store the original HTML when element is first selected (for reset)
  const originalHtmlRef = useRef(selectedElement.outerHtml);
  const currentStyles = parseCurrentStyles(selectedElement.outerHtml);

  const [textContent, setTextContent] = useState(currentStyles.textContent);
  const [fontFamily, setFontFamily] = useState(currentStyles.fontFamily);
  const [fontSize, setFontSize] = useState(currentStyles.fontSize);
  const [color, setColor] = useState(
    currentStyles.color ? rgbToHex(currentStyles.color) : ""
  );
  const [customSize, setCustomSize] = useState("");

  // Reset when selected element changes (different element selected)
  useEffect(() => {
    originalHtmlRef.current = selectedElement.outerHtml;
    const styles = parseCurrentStyles(selectedElement.outerHtml);
    setTextContent(styles.textContent);
    setFontFamily(styles.fontFamily);
    setFontSize(styles.fontSize);
    setColor(styles.color ? rgbToHex(styles.color) : "");
    setCustomSize("");
  }, [selectedElement.selector]);

  // Apply live updates whenever any value changes
  useEffect(() => {
    const effectiveFontSize = customSize || fontSize;
    const newHtml = buildOuterHtml(
      originalHtmlRef.current,
      textContent,
      fontFamily,
      effectiveFontSize,
      color
    );

    if (newHtml && onLiveUpdate) {
      onLiveUpdate(newHtml);
    }
  }, [textContent, fontFamily, fontSize, customSize, color, onLiveUpdate]);

  const handleReset = useCallback(() => {
    const styles = parseCurrentStyles(originalHtmlRef.current);
    setTextContent(styles.textContent);
    setFontFamily(styles.fontFamily);
    setFontSize(styles.fontSize);
    setColor(styles.color ? rgbToHex(styles.color) : "");
    setCustomSize("");

    // Restore original in preview
    if (onLiveUpdate) {
      onLiveUpdate(originalHtmlRef.current);
    }
  }, [onLiveUpdate]);

  const handleClose = useCallback(() => {
    // Parent handles committing changes to history
    onClose();
  }, [onClose]);

  const handleFontSizeChange = (value: string) => {
    setFontSize(value);
    setCustomSize("");
  };

  const handleCustomSizeChange = (value: string) => {
    setCustomSize(value);
    setFontSize("");
  };

  const hasChanges = (() => {
    const effectiveFontSize = customSize || fontSize;
    const newHtml = buildOuterHtml(
      originalHtmlRef.current,
      textContent,
      fontFamily,
      effectiveFontSize,
      color
    );
    return newHtml !== originalHtmlRef.current;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-warm-gray-200">
        <div>
          <h3 className="font-medium text-warm-gray-900">Edit Text</h3>
          <p className="text-xs text-warm-gray-500">
            {getElementTypeName(selectedElement.tagName)}
            {hasChanges && (
              <span className="ml-2 text-rose">• Unsaved changes</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="p-1.5 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-sm] transition-colors"
              title="Reset changes"
            >
              <RotateCcw size={18} />
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-1.5 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-sm] transition-colors"
            title="Close (saves changes)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Text Content */}
        <div className="p-4 border-b border-warm-gray-200">
          <label className="flex items-center gap-2 text-xs font-medium text-warm-gray-600 mb-2 uppercase tracking-wide">
            <Type size={14} />
            Text Content
          </label>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors resize-none text-sm"
            rows={4}
            placeholder="Enter text content..."
          />
        </div>

        {/* Font Family */}
        <div className="p-4 border-b border-warm-gray-200">
          <label className="flex items-center gap-2 text-xs font-medium text-warm-gray-600 mb-2 uppercase tracking-wide">
            <Type size={14} />
            Font Family
          </label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors text-sm"
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="p-4 border-b border-warm-gray-200">
          <label className="flex items-center gap-2 text-xs font-medium text-warm-gray-600 mb-2 uppercase tracking-wide">
            <ALargeSmall size={14} />
            Font Size
          </label>
          <select
            value={fontSize}
            onChange={(e) => handleFontSizeChange(e.target.value)}
            className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors text-sm"
          >
            {FONT_SIZE_OPTIONS.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
          <div className="mt-2">
            <label className="text-xs text-warm-gray-500 mb-1 block">
              Or enter custom size:
            </label>
            <input
              type="text"
              value={customSize}
              onChange={(e) => handleCustomSizeChange(e.target.value)}
              placeholder="e.g., 22px, 1.5rem, 2em"
              className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors text-sm"
            />
          </div>
        </div>

        {/* Font Color */}
        <div className="p-4 border-b border-warm-gray-200">
          <label className="flex items-center gap-2 text-xs font-medium text-warm-gray-600 mb-2 uppercase tracking-wide">
            <Palette size={14} />
            Font Color
          </label>

          {/* Color picker */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="color"
              value={color || "#000000"}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded-[--radius-md] border border-warm-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#000000 or rgb(0,0,0)"
              className="flex-1 px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors text-sm"
            />
            {color && (
              <button
                onClick={() => setColor("")}
                className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-sm] transition-colors"
                title="Clear color"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Color presets */}
          <div className="grid grid-cols-8 gap-1.5">
            {COLOR_PRESETS.map((presetColor) => (
              <button
                key={presetColor}
                onClick={() => setColor(presetColor)}
                className={`w-7 h-7 rounded-[--radius-sm] border-2 transition-all ${
                  color?.toUpperCase() === presetColor
                    ? "border-warm-gray-900 scale-110"
                    : "border-transparent hover:border-warm-gray-300"
                }`}
                style={{ backgroundColor: presetColor }}
                title={presetColor}
              />
            ))}
          </div>
        </div>

        {/* Live indicator */}
        <div className="p-4">
          <p className="text-xs text-warm-gray-500 text-center">
            ✨ Changes appear instantly in the preview
          </p>
        </div>
      </div>
    </motion.div>
  );
}

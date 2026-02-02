"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FONT_OPTIONS, FontSettings } from "@/lib/editor/design-system";

interface FontsPanelProps {
  fonts: FontSettings;
  onFontsChange: (fonts: FontSettings) => void;
  onBack: () => void;
}

export function FontsPanel({ fonts, onFontsChange, onBack }: FontsPanelProps) {
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
          <span className="text-foreground font-medium">Fonts</span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Default Font Style */}
        <div>
          <label className="text-sm text-muted-foreground mb-3 block">
            Default Font Style
          </label>
          <div className="flex rounded-lg overflow-hidden border border-border">
            {(["sans", "serif", "mono"] as const).map((style) => (
              <button
                key={style}
                onClick={() => onFontsChange({ ...fonts, defaultStyle: style })}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  fonts.defaultStyle === style
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Sans Font */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Sans</label>
          <Select
            value={fonts.sans}
            onValueChange={(value) => onFontsChange({ ...fonts, sans: value })}
          >
            <SelectTrigger className="w-full bg-[#1f1f1f] border-[#333] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.sans.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Serif Font */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Serif</label>
          <Select
            value={fonts.serif || ""}
            onValueChange={(value) => onFontsChange({ ...fonts, serif: value })}
          >
            <SelectTrigger className="w-full bg-[#1f1f1f] border-[#333] text-white">
              <SelectValue placeholder="Select font..." />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.serif.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mono Font */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Mono</label>
          <Select
            value={fonts.mono}
            onValueChange={(value) => onFontsChange({ ...fonts, mono: value })}
          >
            <SelectTrigger className="w-full bg-[#1f1f1f] border-[#333] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.mono.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
}

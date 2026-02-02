"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

// Popular Google Fonts for portfolios
const FONT_OPTIONS = [
  { name: "Inter", category: "sans-serif" },
  { name: "Space Grotesk", category: "sans-serif" },
  { name: "Poppins", category: "sans-serif" },
  { name: "DM Sans", category: "sans-serif" },
  { name: "Work Sans", category: "sans-serif" },
  { name: "Manrope", category: "sans-serif" },
  { name: "Plus Jakarta Sans", category: "sans-serif" },
  { name: "Outfit", category: "sans-serif" },
  { name: "Playfair Display", category: "serif" },
  { name: "Lora", category: "serif" },
  { name: "Merriweather", category: "serif" },
  { name: "Libre Baskerville", category: "serif" },
  { name: "Cormorant Garamond", category: "serif" },
  { name: "Lato", category: "sans-serif" },
  { name: "Source Sans 3", category: "sans-serif" },
  { name: "Nunito", category: "sans-serif" },
];

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (font: string) => void;
}

export function FontSelector({ label, value, onChange }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter fonts by search
  const filteredFonts = search
    ? FONT_OPTIONS.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase())
      )
    : FONT_OPTIONS;

  // Group by category
  const sansSerif = filteredFonts.filter((f) => f.category === "sans-serif");
  const serif = filteredFonts.filter((f) => f.category === "serif");

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-warm-gray-700 mb-1">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-warm-gray-200 rounded-lg hover:border-warm-gray-300 focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors"
      >
        <span
          className="text-warm-gray-900"
          style={{ fontFamily: value }}
        >
          {value}
        </span>
        <ChevronDown
          size={16}
          className={`text-warm-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-warm-gray-200 rounded-xl shadow-lg z-20 max-h-64 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-warm-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fonts..."
              className="w-full px-3 py-1.5 text-sm border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
              autoFocus
            />
          </div>

          {/* Font list */}
          <div className="overflow-y-auto max-h-48">
            {sansSerif.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-medium text-warm-gray-500 bg-warm-gray-50">
                  Sans-Serif
                </div>
                {sansSerif.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => {
                      onChange(font.name);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-warm-gray-50 transition-colors"
                    style={{ fontFamily: font.name }}
                  >
                    <span className="text-warm-gray-900">{font.name}</span>
                    {value === font.name && (
                      <Check size={16} className="text-coral" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {serif.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-medium text-warm-gray-500 bg-warm-gray-50">
                  Serif
                </div>
                {serif.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => {
                      onChange(font.name);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-warm-gray-50 transition-colors"
                    style={{ fontFamily: font.name }}
                  >
                    <span className="text-warm-gray-900">{font.name}</span>
                    {value === font.name && (
                      <Check size={16} className="text-coral" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {filteredFonts.length === 0 && (
              <div className="px-3 py-4 text-sm text-warm-gray-500 text-center">
                No fonts found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

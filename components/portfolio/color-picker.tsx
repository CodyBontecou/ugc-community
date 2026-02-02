"use client";

import { useState, useRef, useEffect } from "react";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Sync input when value changes externally
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Validate and apply hex color
  function handleInputChange(newValue: string) {
    setInputValue(newValue);
    // Only apply if valid hex
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  }

  // Handle native color input
  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const color = e.target.value.toUpperCase();
    setInputValue(color);
    onChange(color);
  }

  return (
    <div className="relative" ref={pickerRef}>
      <label className="block text-sm font-medium text-warm-gray-700 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {/* Color swatch button */}
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="w-10 h-10 rounded-lg border-2 border-warm-gray-200 overflow-hidden"
          style={{ backgroundColor: value }}
        >
          <span className="sr-only">Pick color</span>
        </button>

        {/* Hex input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={() => {
            // Reset to valid value on blur
            if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
              setInputValue(value);
            }
          }}
          className="flex-1 px-3 py-2 text-sm border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral"
          placeholder="#000000"
        />
      </div>

      {/* Color picker popover */}
      {showPicker && (
        <div className="absolute left-0 top-full mt-2 p-3 bg-white border border-warm-gray-200 rounded-xl shadow-lg z-20">
          <input
            type="color"
            value={value}
            onChange={handleColorChange}
            className="w-48 h-48 cursor-pointer border-0 p-0"
          />
        </div>
      )}
    </div>
  );
}

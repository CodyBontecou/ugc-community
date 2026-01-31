"use client";

import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import { COMMON_REACTIONS } from "@/lib/messages/constants";

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function ReactionPicker({ onSelect, disabled = false }: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="p-1 text-warm-gray-400 hover:text-warm-gray-600 disabled:opacity-50 transition-colors"
        title="Add reaction"
      >
        <Smile size={16} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg border border-warm-gray-200 p-2 flex gap-1 z-50">
          {COMMON_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelect(emoji)}
              className="p-1 text-lg hover:bg-warm-gray-100 rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, ChevronDown, Pencil } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface SectionItemProps {
  id: string;
  name: string;
  description: string;
  isVisible: boolean;
  variants: string[];
  currentVariant: string;
  onToggleVisibility: () => void;
  onChangeVariant: (variant: string) => void;
}

export function SectionItem({
  id,
  name,
  description,
  isVisible,
  variants,
  currentVariant,
  onToggleVisibility,
  onChangeVariant,
}: SectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [showVariants, setShowVariants] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowVariants(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-white border rounded-xl transition-all ${
        isDragging
          ? "border-coral shadow-lg z-50"
          : "border-warm-gray-200 hover:border-warm-gray-300"
      } ${!isVisible ? "opacity-60" : ""}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing p-1 text-warm-gray-400 hover:text-warm-gray-600"
      >
        <GripVertical size={20} />
      </button>

      {/* Section info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-warm-gray-900">{name}</h3>
          {!isVisible && (
            <span className="text-xs px-2 py-0.5 bg-warm-gray-100 text-warm-gray-500 rounded">
              Hidden
            </span>
          )}
        </div>
        <p className="text-sm text-warm-gray-500 truncate">{description}</p>
      </div>

      {/* Variant selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowVariants(!showVariants)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-warm-gray-700 bg-warm-gray-100 rounded-lg hover:bg-warm-gray-200 transition-colors"
        >
          <span className="capitalize">{currentVariant}</span>
          <ChevronDown
            size={14}
            className={`transition-transform ${showVariants ? "rotate-180" : ""}`}
          />
        </button>

        {showVariants && (
          <div className="absolute right-0 top-full mt-1 py-1 bg-white border border-warm-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
            {variants.map((variant) => (
              <button
                key={variant}
                onClick={() => {
                  onChangeVariant(variant);
                  setShowVariants(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-sm capitalize hover:bg-warm-gray-50 transition-colors ${
                  variant === currentVariant
                    ? "text-coral font-medium"
                    : "text-warm-gray-700"
                }`}
              >
                {variant.replace("-", " ")}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Visibility toggle */}
      <button
        onClick={onToggleVisibility}
        className={`p-2 rounded-lg transition-colors ${
          isVisible
            ? "text-warm-gray-600 hover:bg-warm-gray-100"
            : "text-warm-gray-400 hover:bg-warm-gray-100"
        }`}
        title={isVisible ? "Hide section" : "Show section"}
      >
        {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>

      {/* Edit content link */}
      <Link
        href={`/dashboard/portfolio/content?section=${id}`}
        className="p-2 text-warm-gray-600 hover:bg-warm-gray-100 rounded-lg transition-colors"
        title="Edit content"
      >
        <Pencil size={18} />
      </Link>
    </div>
  );
}

"use client";

import { Heart, Loader2 } from "lucide-react";

interface SaveCreatorButtonProps {
  isSaved: boolean;
  isSaving: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
}

export function SaveCreatorButton({
  isSaved,
  isSaving,
  onToggle,
  size = "sm",
}: SaveCreatorButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSaving) {
      onToggle();
    }
  };

  const sizeClasses = size === "sm"
    ? "w-8 h-8"
    : "w-10 h-10";

  const iconSize = size === "sm" ? 16 : 20;

  return (
    <button
      onClick={handleClick}
      disabled={isSaving}
      className={`${sizeClasses} rounded-full flex items-center justify-center transition-all ${
        isSaved
          ? "bg-coral text-white hover:bg-coral/90"
          : "bg-white/90 text-warm-gray-500 hover:text-coral hover:bg-white"
      } shadow-sm disabled:opacity-50`}
      aria-label={isSaved ? "Remove from saved" : "Save creator"}
    >
      {isSaving ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : (
        <Heart
          size={iconSize}
          className={isSaved ? "fill-current" : ""}
        />
      )}
    </button>
  );
}

"use client";

import { Undo2, Redo2 } from "lucide-react";
import type { HistoryState } from "@/lib/editor/types";

interface HistoryControlsProps {
  history: HistoryState;
  onUndo: () => void;
  onRedo: () => void;
}

export function HistoryControls({ history, onUndo, onRedo }: HistoryControlsProps) {
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="p-2 text-warm-gray-500 hover:text-warm-gray-700 hover:bg-warm-gray-100 rounded-[--radius-sm] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title={`Undo (${history.past.length} available)`}
      >
        <Undo2 size={18} />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="p-2 text-warm-gray-500 hover:text-warm-gray-700 hover:bg-warm-gray-100 rounded-[--radius-sm] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title={`Redo (${history.future.length} available)`}
      >
        <Redo2 size={18} />
      </button>
    </div>
  );
}

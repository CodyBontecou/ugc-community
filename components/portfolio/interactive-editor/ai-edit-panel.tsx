"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  X,
  Check,
  Loader2,
  RefreshCw,
  Minus,
  Plus,
  Briefcase,
  MessageCircle,
  Zap,
  Bold,
  ArrowUp,
  ArrowDown,
  Palette,
  CircleDot,
  Type,
} from "lucide-react";
import type { SelectedElement, QuickAction, TextQuickAction, StyleQuickAction } from "@/lib/editor/types";
import {
  QUICK_ACTION_LABELS,
  QUICK_ACTION_DESCRIPTIONS,
  TEXT_QUICK_ACTIONS,
  STYLE_QUICK_ACTIONS,
} from "@/lib/editor/types";
import { getElementTypeName } from "@/lib/editor/html-element-selector";

interface AIEditPanelProps {
  selectedElement: SelectedElement | null;
  portfolioId: string;
  fullHtml: string;
  onApplyEdit: (newContent: string, isOuterHtml: boolean) => void;
  onDeselect: () => void;
  isStreaming: boolean;
  onStreamingChange: (streaming: boolean) => void;
}

const TEXT_QUICK_ACTION_ICONS: Record<TextQuickAction, React.ReactNode> = {
  rewrite: <RefreshCw size={14} />,
  shorten: <Minus size={14} />,
  expand: <Plus size={14} />,
  professional: <Briefcase size={14} />,
  casual: <MessageCircle size={14} />,
  energetic: <Zap size={14} />,
};

const STYLE_QUICK_ACTION_ICONS: Record<StyleQuickAction, React.ReactNode> = {
  bolder: <Bold size={14} />,
  larger: <ArrowUp size={14} />,
  smaller: <ArrowDown size={14} />,
  colorful: <Palette size={14} />,
  subtle: <CircleDot size={14} />,
  uppercase: <Type size={14} />,
};

export function AIEditPanel({
  selectedElement,
  portfolioId,
  fullHtml,
  onApplyEdit,
  onDeselect,
  isStreaming,
  onStreamingChange,
}: AIEditPanelProps) {
  const [instruction, setInstruction] = useState("");
  const [streamedContent, setStreamedContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchEdit = useCallback(
    async (quickAction?: QuickAction) => {
      if (!selectedElement) return;
      if (!instruction && !quickAction) return;

      setError(null);
      setStreamedContent("");
      onStreamingChange(true);

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/ai/edit-element", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            portfolioId,
            selector: selectedElement.selector,
            currentContent: selectedElement.content,
            outerHtml: selectedElement.outerHtml,
            instruction: quickAction ? undefined : instruction,
            quickAction,
            fullHtml,
            tagName: selectedElement.tagName,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to generate edit");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setStreamedContent(accumulated);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // User cancelled
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to generate edit");
      } finally {
        onStreamingChange(false);
        abortControllerRef.current = null;
      }
    },
    [selectedElement, instruction, portfolioId, fullHtml, onStreamingChange]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim()) {
      fetchEdit();
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    fetchEdit(action);
  };

  const handleAccept = () => {
    if (streamedContent && selectedElement) {
      // Check if the response is full outer HTML (starts with the same tag)
      const trimmed = streamedContent.trim();
      const tagName = selectedElement.tagName.toLowerCase();
      const isOuterHtml = trimmed.startsWith(`<${tagName}`) || trimmed.startsWith(`<${tagName.toUpperCase()}`);
      onApplyEdit(trimmed, isOuterHtml);
      setStreamedContent("");
      setInstruction("");
    }
  };

  const handleReject = () => {
    setStreamedContent("");
    abortControllerRef.current?.abort();
    onStreamingChange(false);
  };

  const handleClose = () => {
    handleReject();
    onDeselect();
  };

  if (!selectedElement) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-warm-gray-100 flex items-center justify-center mb-4">
          <Sparkles size={24} className="text-warm-gray-400" />
        </div>
        <h3 className="font-medium text-warm-gray-900 mb-2">
          Select an element to edit
        </h3>
        <p className="text-sm text-warm-gray-500 max-w-[200px]">
          Click on any text element in your portfolio to edit it with AI
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-warm-gray-200">
        <div>
          <h3 className="font-medium text-warm-gray-900">Edit Element</h3>
          <p className="text-xs text-warm-gray-500">
            {getElementTypeName(selectedElement.tagName)}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="p-1.5 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-sm] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Current content */}
      <div className="p-4 border-b border-warm-gray-200">
        <label className="block text-xs font-medium text-warm-gray-500 mb-2 uppercase tracking-wide">
          Current
        </label>
        <div className="p-3 bg-warm-gray-50 rounded-[--radius-md] text-sm text-warm-gray-700 max-h-24 overflow-y-auto">
          {selectedElement.content ? (
            <div
              dangerouslySetInnerHTML={{ __html: selectedElement.outerHtml }}
              className="preview-content [&>*]:!static [&>*]:!m-0"
            />
          ) : (
            "(empty)"
          )}
        </div>
      </div>

      {/* Streaming preview */}
      <AnimatePresence>
        {(isStreaming || streamedContent) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border-b border-warm-gray-200 bg-rose/5"
          >
            <label className="block text-xs font-medium text-rose mb-2 uppercase tracking-wide">
              {isStreaming ? "Generating..." : "Preview"}
            </label>
            <div className="rounded-[--radius-md] overflow-hidden border border-rose/20 shadow-sm">
              {streamedContent ? (
                <div
                  dangerouslySetInnerHTML={{ __html: streamedContent }}
                  className="preview-rendered"
                />
              ) : (
                <div className="p-3 bg-white text-warm-gray-400 animate-pulse">...</div>
              )}
            </div>

            {!isStreaming && streamedContent && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleAccept}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-warm-gray-900 text-sm font-medium rounded-[--radius-md] hover:bg-warm-gray-800 transition-colors"
                  style={{ color: '#FFFFFF' }}
                >
                  <Check size={16} />
                  Accept
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-warm-gray-200 text-warm-gray-900 text-sm font-medium rounded-[--radius-md] hover:bg-warm-gray-300 transition-colors"
                >
                  <X size={16} />
                  Reject
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <div className="p-4 border-b border-warm-gray-200">
          <div className="p-3 bg-red-50 border border-red-200 rounded-[--radius-md] text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Text Quick Actions */}
      <div className="p-4 border-b border-warm-gray-200">
        <label className="block text-xs font-medium text-warm-gray-500 mb-2 uppercase tracking-wide">
          Text
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TEXT_QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              disabled={isStreaming}
              className="flex items-center gap-2 px-3 py-2 text-sm text-warm-gray-700 bg-warm-gray-50 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors disabled:opacity-50"
              title={QUICK_ACTION_DESCRIPTIONS[action]}
            >
              {TEXT_QUICK_ACTION_ICONS[action]}
              {QUICK_ACTION_LABELS[action]}
            </button>
          ))}
        </div>
      </div>

      {/* Style Quick Actions */}
      <div className="p-4 border-b border-warm-gray-200">
        <label className="block text-xs font-medium text-warm-gray-500 mb-2 uppercase tracking-wide">
          Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          {STYLE_QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              disabled={isStreaming}
              className="flex items-center gap-2 px-3 py-2 text-sm text-warm-gray-700 bg-warm-gray-50 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors disabled:opacity-50"
              title={QUICK_ACTION_DESCRIPTIONS[action]}
            >
              {STYLE_QUICK_ACTION_ICONS[action]}
              {QUICK_ACTION_LABELS[action]}
            </button>
          ))}
        </div>
      </div>

      {/* Custom instruction input */}
      <div className="flex-1 p-4">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <label className="block text-xs font-medium text-warm-gray-500 mb-2 uppercase tracking-wide">
            Custom Edit
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Describe how you want to change this element (text, color, size, font...)..."
            className="flex-1 w-full px-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors resize-none text-sm"
            disabled={isStreaming}
            rows={3}
          />
          <button
            type="submit"
            disabled={!instruction.trim() || isStreaming}
            className="mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-warm-gray-900 font-medium rounded-[--radius-md] hover:bg-warm-gray-800 disabled:opacity-50 transition-colors"
            style={{ color: '#FFFFFF' }}
          >
            {isStreaming ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send size={18} />
                Generate Edit
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

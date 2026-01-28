"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Loader2,
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Check,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { EditableIframe } from "./editable-iframe";
import { AIEditPanel } from "./ai-edit-panel";
import { MediaEditPanel } from "./media-edit-panel";
import { HistoryControls } from "./history-controls";
import { SectionReorderer } from "./section-reorderer";
import { MediaLibrary } from "@/components/media/media-library";
import {
  replaceElementContent,
  replaceElementOuter,
  insertMediaAfter,
  createImageHtml,
  createVideoHtml,
} from "@/lib/editor/html-element-selector";
import type { SelectedElement, HistoryState } from "@/lib/editor/types";
import { MAX_HISTORY_SIZE } from "@/lib/editor/types";
import type { Media } from "@/lib/db/schema";

interface InteractiveHtmlEditorProps {
  portfolioId: string;
  initialHtml: string;
  portfolioTitle: string;
  portfolioSlug: string;
}

type DeviceSize = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTHS: Record<DeviceSize, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function InteractiveHtmlEditor({
  portfolioId,
  initialHtml,
  portfolioTitle,
  portfolioSlug,
}: InteractiveHtmlEditorProps) {
  const router = useRouter();
  const [html, setHtml] = useState(initialHtml);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(
    null
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("desktop");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isRefreshLoading, setIsRefreshLoading] = useState(false);
  const refreshAbortControllerRef = useRef<AbortController | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState<"image" | "video" | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialHtml,
    future: [],
  });

  // Track if initial HTML has changed
  const initialHtmlRef = useRef(initialHtml);

  // Update HTML and track history
  const updateHtml = useCallback((newHtml: string) => {
    setHistory((prev) => ({
      past: [...prev.past.slice(-MAX_HISTORY_SIZE + 1), prev.present],
      present: newHtml,
      future: [],
    }));
    setHtml(newHtml);
    setHasUnsavedChanges(true);
  }, []);

  // Undo
  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      setHtml(previous);
      setHasUnsavedChanges(previous !== initialHtmlRef.current);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
    setSelectedElement(null);
  }, []);

  // Redo
  const handleRedo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      setHtml(next);
      setHasUnsavedChanges(next !== initialHtmlRef.current);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
    setSelectedElement(null);
  }, []);

  // Apply AI edit
  const handleApplyEdit = useCallback(
    (newContent: string, isOuterHtml: boolean = false) => {
      if (!selectedElement) return;

      let newHtml: string;
      if (isOuterHtml) {
        // Replace the entire element (including tag and styles)
        newHtml = replaceElementOuter(html, selectedElement.selector, newContent);
      } else {
        // Replace just the inner content
        newHtml = replaceElementContent(html, selectedElement.selector, newContent);
      }

      if (newHtml !== html) {
        updateHtml(newHtml);
        // Clear selection after applying edit so user can see the result
        setSelectedElement(null);
      }
    },
    [html, selectedElement, updateHtml]
  );

  // Handle section reorder
  const handleReorder = useCallback(
    (newHtml: string) => {
      updateHtml(newHtml);
      setSelectedElement(null);
    },
    [updateHtml]
  );

  // Handle inserting media from library
  const handleInsertMedia = useCallback(
    (media: Media) => {
      // Find the last section to insert after
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const sections = doc.querySelectorAll("body > section, body > div, body > main");
      const lastSection = sections[sections.length - 1];

      if (lastSection) {
        // Create media HTML
        const mediaHtml =
          media.type === "video"
            ? createVideoHtml(media.url, {
                controls: true,
                className: "w-full max-w-2xl mx-auto my-8",
              })
            : createImageHtml(media.url, media.metadata?.alt || "", {
                className: "w-full max-w-2xl mx-auto my-8",
                loading: "lazy",
              });

        // Find a selector for the last section
        const siblings = Array.from(lastSection.parentElement?.children || []).filter(
          (child) => child.tagName === lastSection.tagName
        );
        const index = siblings.indexOf(lastSection) + 1;
        const selector = `body > ${lastSection.tagName.toLowerCase()}:nth-of-type(${index})`;

        // Insert after the last section
        const newHtml = insertMediaAfter(html, selector, mediaHtml);
        if (newHtml !== html) {
          updateHtml(newHtml);
        }
      }

      setShowMediaLibrary(null);
    },
    [html, updateHtml]
  );

  // Handle element refresh (regenerate with AI) - calls API directly and auto-applies
  const handleElementRefresh = useCallback(
    async (element: SelectedElement) => {
      // Don't start a new refresh if one is in progress
      if (isRefreshLoading) return;

      setIsRefreshLoading(true);
      refreshAbortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/ai/edit-element", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            portfolioId,
            selector: element.selector,
            currentContent: element.content,
            outerHtml: element.outerHtml,
            instruction: "randomize",
            fullHtml: html,
            tagName: element.tagName,
          }),
          signal: refreshAbortControllerRef.current.signal,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to generate");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
        }

        // Auto-apply the result
        if (accumulated.trim()) {
          const trimmed = accumulated.trim();
          const newHtml = replaceElementOuter(html, element.selector, trimmed);
          if (newHtml !== html) {
            updateHtml(newHtml);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // User cancelled - ignore
          return;
        }
        console.error("Refresh failed:", err);
        setError(err instanceof Error ? err.message : "Failed to refresh element");
      } finally {
        setIsRefreshLoading(false);
        refreshAbortControllerRef.current = null;
      }
    },
    [isRefreshLoading, portfolioId, html, updateHtml]
  );

  // Save to server
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/html`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent: html }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save");
      }

      setHasUnsavedChanges(false);
      initialHtmlRef.current = html;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div className="h-screen flex flex-col bg-warm-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-warm-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 text-warm-gray-500 hover:text-warm-gray-700 hover:bg-warm-gray-100 rounded-[--radius-sm] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-semibold text-warm-gray-900">{portfolioTitle}</h1>
            <p className="text-xs text-warm-gray-500">Editing portfolio</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Device size toggles */}
          <div className="flex items-center gap-1 p-1 bg-warm-gray-100 rounded-[--radius-md]">
            <button
              onClick={() => setDeviceSize("desktop")}
              className={`p-2 rounded-[--radius-sm] transition-colors ${
                deviceSize === "desktop"
                  ? "bg-white text-warm-gray-900 shadow-sm"
                  : "text-warm-gray-500 hover:text-warm-gray-700"
              }`}
              title="Desktop view"
            >
              <Monitor size={18} />
            </button>
            <button
              onClick={() => setDeviceSize("tablet")}
              className={`p-2 rounded-[--radius-sm] transition-colors ${
                deviceSize === "tablet"
                  ? "bg-white text-warm-gray-900 shadow-sm"
                  : "text-warm-gray-500 hover:text-warm-gray-700"
              }`}
              title="Tablet view"
            >
              <Tablet size={18} />
            </button>
            <button
              onClick={() => setDeviceSize("mobile")}
              className={`p-2 rounded-[--radius-sm] transition-colors ${
                deviceSize === "mobile"
                  ? "bg-white text-warm-gray-900 shadow-sm"
                  : "text-warm-gray-500 hover:text-warm-gray-700"
              }`}
              title="Mobile view"
            >
              <Smartphone size={18} />
            </button>
          </div>

          <HistoryControls
            history={history}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />

          {/* Media buttons */}
          <div className="flex items-center gap-1 p-1 bg-warm-gray-100 rounded-[--radius-md]">
            <button
              onClick={() => setShowMediaLibrary("image")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-warm-gray-600 hover:text-warm-gray-900 hover:bg-white rounded-[--radius-sm] transition-colors"
              title="Add Image"
            >
              <ImageIcon size={16} />
              <span className="hidden sm:inline">Image</span>
            </button>
            <button
              onClick={() => setShowMediaLibrary("video")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-warm-gray-600 hover:text-warm-gray-900 hover:bg-white rounded-[--radius-sm] transition-colors"
              title="Add Video"
            >
              <Video size={16} />
              <span className="hidden sm:inline">Video</span>
            </button>
          </div>

          <a
            href={`/p/${portfolioSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-warm-gray-700 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
          >
            <Eye size={18} />
            Preview
          </a>

          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center gap-2 px-4 py-2 bg-warm-gray-900 font-medium text-sm rounded-[--radius-md] hover:bg-warm-gray-800 disabled:opacity-50 transition-colors"
            style={{ color: '#FFFFFF' }}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check size={18} />
                Saved!
              </>
            ) : (
              <>
                <Save size={18} />
                Save
              </>
            )}
          </button>
        </div>
      </header>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm"
          >
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Iframe preview */}
        <div className="flex-1 flex items-center justify-center p-4 bg-warm-gray-100 overflow-auto">
          <div
            className={`bg-white shadow-lg rounded-[--radius-lg] overflow-hidden transition-all duration-300 ${
              deviceSize === "desktop" ? "w-full h-full" : "h-[calc(100vh-180px)]"
            }`}
            style={{
              width: DEVICE_WIDTHS[deviceSize],
              maxWidth: "100%",
            }}
          >
            <EditableIframe
              html={html}
              onElementSelect={setSelectedElement}
              onElementRefresh={handleElementRefresh}
              selectedSelector={selectedElement?.selector}
              isRefreshLoading={isRefreshLoading}
            />
          </div>
        </div>

        {/* Side panel */}
        <div className="w-80 bg-white border-l border-warm-gray-200 flex flex-col shrink-0">
          <div className="flex-1 overflow-y-auto">
            {selectedElement?.mediaData ? (
              <MediaEditPanel
                selectedElement={selectedElement}
                mediaData={selectedElement.mediaData}
                fullHtml={html}
                onApplyEdit={handleApplyEdit}
                onDeselect={() => setSelectedElement(null)}
              />
            ) : (
              <AIEditPanel
                selectedElement={selectedElement}
                portfolioId={portfolioId}
                fullHtml={html}
                onApplyEdit={handleApplyEdit}
                onDeselect={() => setSelectedElement(null)}
                isStreaming={isStreaming}
                onStreamingChange={setIsStreaming}
              />
            )}
          </div>

          <SectionReorderer
            html={html}
            onReorder={handleReorder}
            disabled={isStreaming}
          />
        </div>
      </div>

      {/* Media Library Modal */}
      <AnimatePresence>
        {showMediaLibrary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl h-[80vh] relative"
            >
              <MediaLibrary
                onSelect={handleInsertMedia}
                selectionMode={true}
                filterType={showMediaLibrary}
                onClose={() => setShowMediaLibrary(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

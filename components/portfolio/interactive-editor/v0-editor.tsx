"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Loader2,
  Monitor,
  Smartphone,
  Check,
  Share2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  MoreHorizontal,
  Undo2,
  Redo2,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { EditableIframe } from "./editable-iframe";
import { V0ChatPanel } from "./v0-chat-panel";
import { V0SectionNav } from "./v0-section-nav";
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

interface V0EditorProps {
  portfolioId: string;
  initialHtml: string;
  portfolioTitle: string;
  portfolioSlug: string;
}

type DeviceSize = "desktop" | "mobile";

const DEVICE_WIDTHS: Record<DeviceSize, string> = {
  desktop: "100%",
  mobile: "375px",
};

export function V0Editor({
  portfolioId,
  initialHtml,
  portfolioTitle,
  portfolioSlug,
}: V0EditorProps) {
  const router = useRouter();
  const [html, setHtml] = useState(initialHtml);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("desktop");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isRefreshLoading, setIsRefreshLoading] = useState(false);
  const refreshAbortControllerRef = useRef<AbortController | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState<"image" | "video" | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(384); // Default w-96 = 384px
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  // Track HTML state before live editing started
  const htmlBeforeLiveEditRef = useRef<string | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialHtml,
    future: [],
  });

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
        newHtml = replaceElementOuter(html, selectedElement.selector, newContent);
      } else {
        newHtml = replaceElementContent(html, selectedElement.selector, newContent);
      }

      if (newHtml !== html) {
        updateHtml(newHtml);
        setSelectedElement(null);
      }
    },
    [html, selectedElement, updateHtml]
  );

  // Live update for real-time preview
  const handleLiveUpdate = useCallback(
    (newOuterHtml: string) => {
      if (!selectedElement) return;

      const newHtml = replaceElementOuter(html, selectedElement.selector, newOuterHtml);
      if (newHtml !== html) {
        if (htmlBeforeLiveEditRef.current === null) {
          htmlBeforeLiveEditRef.current = html;
        }
        setHtml(newHtml);
        setHasUnsavedChanges(true);
      }
    },
    [html, selectedElement]
  );

  // Commit live edits to history
  const commitLiveEdit = useCallback(() => {
    if (htmlBeforeLiveEditRef.current !== null && htmlBeforeLiveEditRef.current !== html) {
      setHistory((prev) => ({
        past: [...prev.past.slice(-MAX_HISTORY_SIZE + 1), htmlBeforeLiveEditRef.current!],
        present: html,
        future: [],
      }));
    }
    htmlBeforeLiveEditRef.current = null;
  }, [html]);

  // Handle element selection
  const handleElementSelect = useCallback((element: SelectedElement) => {
    if (selectedElement && selectedElement.selector !== element.selector) {
      commitLiveEdit();
    }
    setSelectedElement(element);
  }, [selectedElement, commitLiveEdit]);

  // Handle element refresh
  const handleElementRefresh = useCallback(
    async (element: SelectedElement) => {
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

        if (accumulated.trim()) {
          const trimmed = accumulated.trim();
          const newHtml = replaceElementOuter(html, element.selector, trimmed);
          if (newHtml !== html) {
            updateHtml(newHtml);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
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

  // Handle inserting media
  const handleInsertMedia = useCallback(
    (media: Media) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const sections = doc.querySelectorAll("body > section, body > div, body > main");
      const lastSection = sections[sections.length - 1];

      if (lastSection) {
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

        const siblings = Array.from(lastSection.parentElement?.children || []).filter(
          (child) => child.tagName === lastSection.tagName
        );
        const index = siblings.indexOf(lastSection) + 1;
        const selector = `body > ${lastSection.tagName.toLowerCase()}:nth-of-type(${index})`;

        const newHtml = insertMediaAfter(html, selector, mediaHtml);
        if (newHtml !== html) {
          updateHtml(newHtml);
        }
      }

      setShowMediaLibrary(null);
    },
    [html, updateHtml]
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

  // Handle full page generation from chat
  const handleFullPageGenerate = useCallback((newHtml: string) => {
    updateHtml(newHtml);
  }, [updateHtml]);

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

  // Handle sidebar resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = { startX: e.clientX, startWidth: sidebarWidth };
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;
      
      const delta = e.clientX - resizeRef.current.startX;
      const newWidth = Math.min(Math.max(resizeRef.current.startWidth + delta, 280), 600);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between h-12 px-4 bg-[#0a0a0a] border-b border-[#1f1f1f]">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-lg">v0</span>
            <span className="text-[#666]">/</span>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <button className="p-1 text-[#666] hover:text-white transition-colors">
            <RotateCw size={14} />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Sparkles size={14} className="text-[#666]" />
          <span className="text-[#999]">Drafts</span>
          <span className="text-[#666]">/</span>
          <span className="text-white">{portfolioTitle}</span>
          <ChevronDown size={14} className="text-[#666]" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-[#1f1f1f] hover:bg-[#2a2a2a] rounded-lg transition-colors">
            <Share2 size={14} />
            Share
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-black bg-white hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saveSuccess ? (
              <Check size={14} />
            ) : (
              <Save size={14} />
            )}
            {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Publish"}
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chat Panel */}
        <div
          className={`bg-[#0a0a0a] border-r border-[#1f1f1f] flex flex-col relative ${
            isSidebarCollapsed ? "w-0 overflow-hidden" : ""
          }`}
          style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
        >
          <V0ChatPanel
            selectedElement={selectedElement}
            portfolioId={portfolioId}
            fullHtml={html}
            onApplyEdit={handleApplyEdit}
            onFullPageGenerate={handleFullPageGenerate}
            onDeselect={() => setSelectedElement(null)}
            isStreaming={isStreaming}
            onStreamingChange={setIsStreaming}
          />
          {/* Resize handle */}
          {!isSidebarCollapsed && (
            <div
              onMouseDown={handleResizeStart}
              className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 transition-colors ${
                isResizing ? "bg-blue-500/50" : "bg-transparent"
              }`}
            />
          )}
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">
          {/* Preview Toolbar */}
          <div className="flex items-center justify-between h-12 px-4 bg-[#0a0a0a] border-b border-[#1f1f1f]">
            <div className="flex items-center gap-2">
              {/* Collapse sidebar toggle */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 text-[#666] hover:text-white transition-colors"
              >
                {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>

            {/* URL Bar */}
            <div className="flex items-center gap-2">
              <button className="p-1.5 text-[#666] hover:text-white transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button className="p-1.5 text-[#666] hover:text-white transition-colors">
                <ChevronRight size={14} />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1f1f1f] rounded-lg text-sm text-[#999]">
                <span>/</span>
              </div>
              <button className="p-1.5 text-[#666] hover:text-white transition-colors">
                <RotateCw size={14} />
              </button>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#666]">Latest</span>
              <ChevronDown size={14} className="text-[#666]" />
              
              {/* Device toggles */}
              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => setDeviceSize("desktop")}
                  className={`p-2 rounded-md transition-colors ${
                    deviceSize === "desktop" ? "text-white bg-[#1f1f1f]" : "text-[#666] hover:text-white"
                  }`}
                  title="Desktop"
                >
                  <Monitor size={16} />
                </button>
                <button
                  onClick={() => setDeviceSize("mobile")}
                  className={`p-2 rounded-md transition-colors ${
                    deviceSize === "mobile" ? "text-white bg-[#1f1f1f]" : "text-[#666] hover:text-white"
                  }`}
                  title="Mobile"
                >
                  <Smartphone size={16} />
                </button>
              </div>
              
              {/* Undo/Redo */}
              <div className="flex items-center gap-1 ml-2 border-l border-[#1f1f1f] pl-2">
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className="p-2 text-[#666] hover:text-white transition-colors disabled:opacity-30"
                  title="Undo"
                >
                  <Undo2 size={16} />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className="p-2 text-[#666] hover:text-white transition-colors disabled:opacity-30"
                  title="Redo"
                >
                  <Redo2 size={16} />
                </button>
              </div>
              
              <button className="p-2 text-[#666] hover:text-white transition-colors">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 p-4 overflow-auto relative">
            <div
              className={`mx-auto bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300 h-full ${
                deviceSize === "desktop" ? "w-full max-w-[calc(100%-120px)]" : "w-[375px]"
              }`}
            >
              <EditableIframe
                html={html}
                onElementSelect={handleElementSelect}
                onElementRefresh={handleElementRefresh}
                selectedSelector={selectedElement?.selector}
                isRefreshLoading={isRefreshLoading}
              />
            </div>
            {/* Section Navigation */}
            <V0SectionNav
              html={html}
              onSectionClick={(selector) => {
                // Scroll to section in iframe
                const iframe = document.querySelector('iframe[title="Portfolio Preview"]') as HTMLIFrameElement;
                if (iframe?.contentWindow) {
                  iframe.contentWindow.postMessage({ type: "scroll-to", selector }, "*");
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-3 bg-red-500/90 text-white text-sm rounded-lg shadow-lg"
          >
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-3 underline hover:no-underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Library Modal */}
      <AnimatePresence>
        {showMediaLibrary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
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

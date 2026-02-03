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
  Eye,
  Code,
  Globe,
} from "lucide-react";
import { EditableIframe } from "./editable-iframe";
import { AIChatPanel } from "./ai-chat-panel";
import { V0SectionNav } from "./v0-section-nav";
import { MediaLibrary } from "@/components/media/media-library";
import { EditorSidebarNav, type SidebarView } from "./editor-sidebar-nav";
import { DesignPanel } from "./design-panel";
import { HistoryPanel } from "./history-panel";
import { PublishDialog } from "./publish-dialog";
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
import {
  DesignSystem,
  DEFAULT_DESIGN_SYSTEM,
  applyDesignSystemToHtml,
} from "@/lib/editor/design-system";
import { EditorUserMenu } from "./editor-user-menu";

interface V0EditorProps {
  portfolioId: string;
  initialHtml: string;
  portfolioTitle: string;
  portfolioSlug: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    username?: string | null;
  };
}

interface VersionInfo {
  liveVersionId: string | null;
  liveVersionNumber: number | null;
  isPublished: boolean;
  latestVersionNumber: number | null;
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
  user,
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
  const [sidebarWidth, setSidebarWidth] = useState(384);
  
  // Load sidebar state from localStorage after hydration
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("editor-sidebar-collapsed");
    if (savedCollapsed === "true") {
      setIsSidebarCollapsed(true);
    }
    const savedWidth = localStorage.getItem("editor-sidebar-width");
    if (savedWidth) {
      setSidebarWidth(Math.min(Math.max(Number(savedWidth), 280), 600));
    }
  }, []);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  
  // Sidebar view state (chat vs design)
  const [sidebarView, setSidebarView] = useState<SidebarView>("chat");
  
  // Design system state
  const [designSystem, setDesignSystem] = useState<DesignSystem>(DEFAULT_DESIGN_SYSTEM);

  // Publish dialog state
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  
  // Pending message for cross-panel chat (design -> chat)
  const [pendingChatMessage, setPendingChatMessage] = useState<string | null>(null);

  // Version tracking state
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    liveVersionId: null,
    liveVersionNumber: null,
    isPublished: false,
    latestVersionNumber: null,
  });
  const [deployedHtml, setDeployedHtml] = useState<string | null>(null);

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

  // Save to server and create a version
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

      // Create a version snapshot when saving
      await fetch(`/api/portfolios/${portfolioId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent: html }),
      });

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

  // Handle design system changes - apply to HTML in real-time
  const handleDesignSystemChange = useCallback((newDesign: DesignSystem) => {
    setDesignSystem(newDesign);
    // Apply design system CSS to iframe in real-time
    const iframe = document.querySelector('iframe[title="Portfolio Preview"]') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ 
        type: "apply-design-system", 
        designSystem: newDesign 
      }, "*");
    }
  }, []);

  // Handle element style changes from design panel
  const handleElementStyleChange = useCallback((selector: string, styles: Record<string, string>) => {
    const iframe = document.querySelector('iframe[title="Portfolio Preview"]') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({
        type: "apply-element-styles",
        selector,
        styles,
      }, "*");
    }
    // Also update the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const element = doc.querySelector(selector) as HTMLElement;
    if (element) {
      Object.entries(styles).forEach(([key, value]) => {
        element.style[key as any] = value;
      });
      const newHtml = `<!DOCTYPE html>${doc.documentElement.outerHTML}`;
      if (newHtml !== html) {
        updateHtml(newHtml);
      }
    }
  }, [html, updateHtml]);

  // Handle element content changes from design panel
  const handleElementContentChange = useCallback((selector: string, content: string) => {
    // Send to iframe for immediate visual update
    const iframe = document.querySelector('iframe[title="Portfolio Preview"]') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({
        type: "apply-element-content",
        selector,
        content,
      }, "*");
    }
    // Also update the HTML state
    const newHtml = replaceElementContent(html, selector, content);
    if (newHtml !== html) {
      updateHtml(newHtml);
    }
  }, [html, updateHtml]);

  // Handle element chat from design panel - switch to chat and send message there
  const handleElementChat = useCallback((message: string) => {
    if (!selectedElement) return;
    // Set pending message and switch to chat view
    // The chat panel will pick up and send this message
    setPendingChatMessage(message);
    setSidebarView("chat");
  }, [selectedElement]);

  // Fetch version info on mount and after deployments
  const fetchVersionInfo = useCallback(async () => {
    try {
      const [versionsRes, portfolioRes] = await Promise.all([
        fetch(`/api/portfolios/${portfolioId}/versions`),
        fetch(`/api/portfolios/${portfolioId}`),
      ]);
      
      if (versionsRes.ok) {
        const data = await versionsRes.json();
        setVersionInfo({
          liveVersionId: data.liveVersionId,
          liveVersionNumber: data.liveVersionNumber,
          isPublished: data.isPublished,
          latestVersionNumber: data.versions?.[0]?.versionNumber ?? null,
        });
      }
      
      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json();
        if (portfolioData.isPublished && portfolioData.htmlContent) {
          setDeployedHtml(portfolioData.htmlContent);
        }
      }
    } catch (err) {
      console.error("Failed to fetch version info:", err);
    }
  }, [portfolioId]);

  useEffect(() => {
    fetchVersionInfo();
  }, [fetchVersionInfo]);

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

  // Persist sidebar width to localStorage
  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem("editor-sidebar-width", String(sidebarWidth));
    }
  }, [sidebarWidth, isResizing]);

  // Persist sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("editor-sidebar-collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

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
          {/* Logo with Version Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-lg">ugc.community</span>
            <span className="text-[#666]">/</span>
            {versionInfo.isPublished ? (
              <div className="relative group">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 bg-[#1f1f1f] border border-[#333] rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {versionInfo.liveVersionNumber 
                    ? `v${versionInfo.liveVersionNumber} Live`
                    : "Published"}
                  {deployedHtml && html !== deployedHtml && (
                    <span className="text-yellow-400 ml-1">• Draft</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative group">
                <div className="w-3 h-3 rounded-full bg-[#666] cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 bg-[#1f1f1f] border border-[#333] rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Not published
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Sparkles size={14} className="text-[#666]" />
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
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-[#1f1f1f] hover:bg-[#2a2a2a] rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saveSuccess ? (
              <Check size={14} />
            ) : (
              <Save size={14} />
            )}
            {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save"}
          </button>
          <button
            onClick={() => setShowPublishDialog(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-[#1f1f1f] hover:bg-[#2a2a2a] rounded-lg transition-colors"
          >
            <Globe size={14} />
            Publish
          </button>
          <EditorUserMenu user={user} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <EditorSidebarNav
          activeView={sidebarView}
          onViewChange={setSidebarView}
        />

        {/* Left Sidebar - Chat or Design Panel */}
        <div
          className={`bg-[#0a0a0a] border-r border-[#1f1f1f] flex flex-col relative ${
            isSidebarCollapsed ? "w-0 overflow-hidden" : ""
          }`}
          style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
        >
          <AnimatePresence mode="wait">
            {sidebarView === "chat" ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <AIChatPanel
                  selectedElement={selectedElement}
                  portfolioId={portfolioId}
                  fullHtml={html}
                  onApplyEdit={handleApplyEdit}
                  onFullPageGenerate={handleFullPageGenerate}
                  onDeselect={() => setSelectedElement(null)}
                  isStreaming={isStreaming}
                  onStreamingChange={setIsStreaming}
                  pendingMessage={pendingChatMessage}
                  onPendingMessageHandled={() => setPendingChatMessage(null)}
                />
              </motion.div>
            ) : sidebarView === "design" ? (
              <motion.div
                key="design"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <DesignPanel
                  designSystem={designSystem}
                  onDesignSystemChange={handleDesignSystemChange}
                  selectedElement={selectedElement}
                  onElementStyleChange={handleElementStyleChange}
                  onElementContentChange={handleElementContentChange}
                  onDeselect={() => setSelectedElement(null)}
                  onElementChat={handleElementChat}
                  isStreaming={isStreaming}
                  onAddImage={() => setShowMediaLibrary("image")}
                  onAddVideo={() => setShowMediaLibrary("video")}
                />
              </motion.div>
            ) : sidebarView === "history" ? (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <HistoryPanel
                  portfolioId={portfolioId}
                  currentHtml={html}
                  onRestore={(restoredHtml) => {
                    updateHtml(restoredHtml);
                  }}
                  onPreview={(previewHtml) => {
                    setHtml(previewHtml);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center text-muted-foreground"
              >
                <div className="text-center">
                  <p className="text-sm">Coming soon</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
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
              
              {/* View/Code toggle */}
              <div className="flex items-center bg-[#1f1f1f] rounded-lg p-0.5 ml-2">
                <button className="p-1.5 rounded-md bg-[#2a2a2a] text-white">
                  <Eye size={14} />
                </button>
                <button className="p-1.5 rounded-md text-[#666] hover:text-white transition-colors">
                  <Code size={14} />
                </button>
              </div>
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
          <div className={`flex-1 overflow-auto relative ${deviceSize === "desktop" ? "" : "p-4"}`}>
            <div
              className={`mx-auto bg-white overflow-hidden transition-all duration-300 h-full ${
                deviceSize === "desktop" ? "w-full" : "w-[375px] rounded-lg shadow-2xl"
              }`}
            >
              <EditableIframe
                html={html}
                onElementSelect={handleElementSelect}
                onElementRefresh={handleElementRefresh}
                selectedSelector={selectedElement?.selector}
                isRefreshLoading={isRefreshLoading}
                isDesignMode={sidebarView === "design"}
                isResizing={isResizing}
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

      {/* Unsaved changes banner */}
      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 bg-[#1f1f1f] rounded-lg shadow-lg border border-[#333]"
          >
            <div className="flex items-center gap-2 text-white text-sm">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              Unsaved Changes
            </div>
            <button
              onClick={() => {
                setHtml(initialHtmlRef.current);
                setHasUnsavedChanges(false);
              }}
              className="px-3 py-1 text-sm text-[#999] hover:text-white transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Publish Dialog */}
      <PublishDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        portfolioId={portfolioId}
        html={html}
        onPublishSuccess={() => {
          setHasUnsavedChanges(false);
          initialHtmlRef.current = html;
          setDeployedHtml(html);
          // Refresh version info to update the live version indicator
          fetchVersionInfo();
        }}
        onHtmlChange={(newHtml) => {
          updateHtml(newHtml);
          initialHtmlRef.current = newHtml;
          setHasUnsavedChanges(false);
          // Refresh version info after loading a different version
          fetchVersionInfo();
        }}
      />
    </div>
  );
}

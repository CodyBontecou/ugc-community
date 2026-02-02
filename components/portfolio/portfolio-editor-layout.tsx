"use client";

/**
 * Portfolio Editor Layout
 *
 * A Figma-like split-pane layout with the editor on the left and live preview on the right.
 */

import { useState, useEffect, useCallback } from "react";
import { PanelLeft, PanelRight, Eye, EyeOff, RefreshCw } from "lucide-react";
import { PortfolioPreviewFrame } from "./preview/portfolio-preview-frame";
import type { PortfolioConfig, Template, User, Media, PortfolioProject } from "@/lib/db/schema";

interface ProjectWithMedia extends PortfolioProject {
  coverMedia: Media | null;
}

interface PortfolioPreviewData {
  user: User;
  config: PortfolioConfig;
  template: Template;
  projects: ProjectWithMedia[];
  mediaMap: Record<string, Media>;
}

interface PortfolioEditorLayoutProps {
  children: React.ReactNode;
  initialData: PortfolioPreviewData;
}

export function PortfolioEditorLayout({ children, initialData }: PortfolioEditorLayoutProps) {
  const [previewData, setPreviewData] = useState<PortfolioPreviewData>(initialData);
  const [showPreview, setShowPreview] = useState(true);
  const [panelWidth, setPanelWidth] = useState(50); // percentage
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Refresh preview data
  const refreshPreview = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/portfolio/preview");
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      }
    } catch (error) {
      console.error("Failed to refresh preview:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh preview when changes are made (debounced)
  useEffect(() => {
    // Listen for custom events from editor components
    const handlePreviewUpdate = () => {
      refreshPreview();
    };

    window.addEventListener("portfolio-updated", handlePreviewUpdate);
    return () => window.removeEventListener("portfolio-updated", handlePreviewUpdate);
  }, [refreshPreview]);

  // Handle panel resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById("editor-layout-container");
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      setPanelWidth(Math.min(Math.max(newWidth, 25), 75));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      id="editor-layout-container"
      className="flex h-[calc(100vh-64px)] overflow-hidden bg-warm-gray-50"
    >
      {/* Editor Panel */}
      <div
        className="flex flex-col overflow-hidden bg-white border-r border-warm-gray-200"
        style={{ width: showPreview ? `${panelWidth}%` : "100%" }}
      >
        {/* Editor Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-warm-gray-200 bg-warm-gray-50 shrink-0">
          <h2 className="text-sm font-medium text-warm-gray-700">Editor</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showPreview
                  ? "bg-coral/10 text-coral"
                  : "bg-warm-gray-100 text-warm-gray-600 hover:text-warm-gray-900"
              }`}
            >
              {showPreview ? (
                <>
                  <EyeOff size={16} />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye size={16} />
                  Show Preview
                </>
              )}
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>

      {/* Resize Handle */}
      {showPreview && (
        <div
          className={`w-1 cursor-col-resize hover:bg-coral/50 transition-colors shrink-0 ${
            isDragging ? "bg-coral" : "bg-warm-gray-200"
          }`}
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Preview Panel */}
      {showPreview && (
        <div
          className="flex flex-col overflow-hidden"
          style={{ width: `${100 - panelWidth}%` }}
        >
          {/* Preview Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-warm-gray-200 bg-white shrink-0">
            <h2 className="text-sm font-medium text-warm-gray-700">Live Preview</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshPreview}
                disabled={isRefreshing}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-warm-gray-100 text-warm-gray-600 hover:text-warm-gray-900 transition-colors ${
                  isRefreshing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {/* Preview Frame */}
          <div className="flex-1 overflow-hidden">
            <PortfolioPreviewFrame
              user={previewData.user}
              config={previewData.config}
              template={previewData.template}
              projects={previewData.projects}
              mediaMap={previewData.mediaMap}
            />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { History, RotateCcw, Eye, Loader2, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortfolioVersion } from "@/lib/db/schema";

interface HistoryPanelProps {
  portfolioId: string;
  currentHtml: string;
  onRestore: (html: string) => void;
  onPreview: (html: string) => void;
}

export function HistoryPanel({
  portfolioId,
  currentHtml,
  onRestore,
  onPreview,
}: HistoryPanelProps) {
  const [versions, setVersions] = useState<PortfolioVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Fetch versions on mount
  useEffect(() => {
    fetchVersions();
  }, [portfolioId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/versions`);
      if (!response.ok) {
        throw new Error("Failed to fetch versions");
      }
      const data = await response.json();
      setVersions(data.versions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = (version: PortfolioVersion) => {
    setPreviewingId(version.id);
    onPreview(version.htmlContent);
  };

  const handleRestore = async (version: PortfolioVersion) => {
    setRestoringId(version.id);
    try {
      onRestore(version.htmlContent);
    } finally {
      setRestoringId(null);
      setPreviewingId(null);
    }
  };

  const handleExitPreview = () => {
    setPreviewingId(null);
    onPreview(currentHtml);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <p className="text-red-400 text-sm mb-2">{error}</p>
        <button
          onClick={fetchVersions}
          className="text-sm text-[#999] hover:text-white transition-colors underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2 mb-1">
          <History size={18} className="text-[#666]" />
          <h2 className="text-white font-medium">Version History</h2>
        </div>
        <p className="text-sm text-[#666]">
          Browse and restore previous versions of your site
        </p>
      </div>

      {/* Preview mode banner */}
      {previewingId && (
        <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between">
          <span className="text-sm text-blue-400">Previewing version</span>
          <button
            onClick={handleExitPreview}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Exit preview
          </button>
        </div>
      )}

      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Clock size={32} className="text-[#333] mb-3" />
            <p className="text-[#666] text-sm">No saved versions yet</p>
            <p className="text-[#444] text-xs mt-1">
              Versions are saved each time you publish
            </p>
          </div>
        ) : (
          <div className="p-2">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className={cn(
                  "p-3 rounded-lg mb-2 transition-colors",
                  previewingId === version.id
                    ? "bg-blue-500/10 border border-blue-500/30"
                    : "bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-transparent"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">
                        Version {version.versionNumber}
                      </span>
                      {index === 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                          Latest
                        </span>
                      )}
                    </div>
                    {version.title && (
                      <p className="text-[#999] text-xs mt-0.5">{version.title}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#666] text-xs mb-3">
                  <Clock size={12} />
                  <span>
                    {dayjs(version.createdAt).format("MMM D, YYYY [at] h:mm A")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreview(version)}
                    disabled={previewingId === version.id}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-colors",
                      previewingId === version.id
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-[#2a2a2a] text-[#999] hover:text-white hover:bg-[#333]"
                    )}
                  >
                    <Eye size={12} />
                    {previewingId === version.id ? "Previewing" : "Preview"}
                  </button>
                  <button
                    onClick={() => handleRestore(version)}
                    disabled={restoringId === version.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#2a2a2a] text-[#999] hover:text-white hover:bg-[#333] rounded transition-colors disabled:opacity-50"
                  >
                    {restoringId === version.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RotateCcw size={12} />
                    )}
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

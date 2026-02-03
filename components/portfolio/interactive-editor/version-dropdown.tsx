"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Clock, Eye } from "lucide-react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import type { PortfolioVersion } from "@/lib/db/schema";

interface VersionDropdownProps {
  versions: PortfolioVersion[];
  currentVersionId: string | null;
  liveVersionId: string | null;
  isPreviewingVersion: boolean;
  onSelectVersion: (version: PortfolioVersion) => void;
  onExitPreview: () => void;
}

export function VersionDropdown({
  versions,
  currentVersionId,
  liveVersionId,
  isPreviewingVersion,
  onSelectVersion,
  onExitPreview,
}: VersionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get current display label
  const getDisplayLabel = () => {
    if (isPreviewingVersion && currentVersionId) {
      const version = versions.find(v => v.id === currentVersionId);
      if (version) {
        return `v${version.versionNumber}`;
      }
    }
    return "Latest";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1 text-sm transition-colors px-2 py-1 rounded",
          isPreviewingVersion
            ? "text-blue-400 bg-blue-500/10"
            : "text-[#666] hover:text-white"
        )}
      >
        {isPreviewingVersion && <Eye size={12} className="mr-1" />}
        <span>{getDisplayLabel()}</span>
        <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-[#333]">
            <p className="text-xs text-[#666] font-medium uppercase tracking-wide">Version History</p>
          </div>

          {/* Exit preview option */}
          {isPreviewingVersion && (
            <button
              onClick={() => {
                onExitPreview();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-blue-400 hover:bg-blue-500/10 border-b border-[#333] flex items-center gap-2"
            >
              <span>← Back to current draft</span>
            </button>
          )}

          {/* Version list */}
          <div className="max-h-64 overflow-y-auto">
            {versions.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <Clock size={20} className="mx-auto text-[#444] mb-2" />
                <p className="text-sm text-[#666]">No saved versions yet</p>
                <p className="text-xs text-[#444] mt-1">Save to create a version</p>
              </div>
            ) : (
              versions.map((version, index) => {
                const isLive = version.id === liveVersionId;
                const isCurrent = version.id === currentVersionId && isPreviewingVersion;

                return (
                  <button
                    key={version.id}
                    onClick={() => {
                      onSelectVersion(version);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left hover:bg-[#2a2a2a] transition-colors flex items-start gap-3",
                      isCurrent && "bg-[#2a2a2a]"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-medium">
                          Version {version.versionNumber}
                        </span>
                        {index === 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#333] text-[#999] rounded">
                            Latest
                          </span>
                        )}
                        {isLive && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                            Live
                          </span>
                        )}
                      </div>
                      {version.title && (
                        <p className="text-xs text-[#666] mt-0.5 truncate">{version.title}</p>
                      )}
                      <p className="text-xs text-[#444] mt-1">
                        {dayjs(version.createdAt).format("MMM D, YYYY [at] h:mm A")}
                      </p>
                    </div>
                    {isCurrent && (
                      <Check size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

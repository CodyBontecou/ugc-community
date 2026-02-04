"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Video,
  X,
  Trash2,
  Upload,
  FolderOpen,
  Link,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import type { SelectedElement, MediaElementData } from "@/lib/editor/types";
import type { Media } from "@/lib/db/schema";
import { MediaLibrary } from "@/components/media/media-library";
import { getElementTypeName } from "@/lib/editor/html-element-selector";

interface MediaEditPanelProps {
  selectedElement: SelectedElement;
  mediaData: MediaElementData;
  fullHtml: string;
  onApplyEdit: (newContent: string, isOuterHtml: boolean) => void;
  onDeselect: () => void;
}

export function MediaEditPanel({
  selectedElement,
  mediaData,
  fullHtml,
  onApplyEdit,
  onDeselect,
}: MediaEditPanelProps) {
  const [altText, setAltText] = useState(mediaData.alt || "");
  const [showLibrary, setShowLibrary] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video controls state
  const [autoplay, setAutoplay] = useState(mediaData.autoplay || false);
  const [loop, setLoop] = useState(mediaData.loop || false);
  const [muted, setMuted] = useState(mediaData.muted || false);

  const isVideo = mediaData.type === "video";

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }

      const media: Media = await response.json();
      applyNewSrc(media.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleMediaSelect = (media: Media) => {
    applyNewSrc(media.url);
    setShowLibrary(false);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      applyNewSrc(urlInput.trim());
      setShowUrlInput(false);
      setUrlInput("");
    }
  };

  const applyNewSrc = useCallback(
    (newSrc: string) => {
      // Build updated element based on tag type
      const tagName = selectedElement.tagName.toUpperCase();
      let newHtml = selectedElement.outerHtml;

      if (tagName === "IMG") {
        // Parse and update the img element
        const parser = new DOMParser();
        const doc = parser.parseFromString(
          `<div>${selectedElement.outerHtml}</div>`,
          "text/html"
        );
        const img = doc.querySelector("img");
        if (img) {
          img.setAttribute("src", newSrc);
          img.removeAttribute("srcset");
          if (altText) {
            img.setAttribute("alt", altText);
          }
          newHtml = img.outerHTML;
        }
      } else if (tagName === "VIDEO") {
        const parser = new DOMParser();
        const doc = parser.parseFromString(
          `<div>${selectedElement.outerHtml}</div>`,
          "text/html"
        );
        const video = doc.querySelector("video");
        if (video) {
          // Update src or source element
          if (video.hasAttribute("src")) {
            video.setAttribute("src", newSrc);
          } else {
            const source = video.querySelector("source");
            if (source) {
              source.setAttribute("src", newSrc);
            } else {
              video.setAttribute("src", newSrc);
            }
          }
          newHtml = video.outerHTML;
        }
      } else if (tagName === "PICTURE" || tagName === "FIGURE") {
        const parser = new DOMParser();
        const doc = parser.parseFromString(
          `<div>${selectedElement.outerHtml}</div>`,
          "text/html"
        );
        const element = doc.querySelector(tagName.toLowerCase());
        if (element) {
          const img = element.querySelector("img");
          const video = element.querySelector("video");
          if (img) {
            img.setAttribute("src", newSrc);
            img.removeAttribute("srcset");
            if (altText) {
              img.setAttribute("alt", altText);
            }
          } else if (video) {
            if (video.hasAttribute("src")) {
              video.setAttribute("src", newSrc);
            } else {
              const source = video.querySelector("source");
              if (source) {
                source.setAttribute("src", newSrc);
              }
            }
          }
          newHtml = element.outerHTML;
        }
      }

      onApplyEdit(newHtml, true);
    },
    [selectedElement, altText, onApplyEdit]
  );

  const handleRemove = () => {
    // Replace element with empty string to remove it
    onApplyEdit("", true);
    onDeselect();
  };

  const handleSaveAltText = () => {
    if (altText !== mediaData.alt) {
      const tagName = selectedElement.tagName.toUpperCase();
      const parser = new DOMParser();
      const doc = parser.parseFromString(
        `<div>${selectedElement.outerHtml}</div>`,
        "text/html"
      );

      if (tagName === "IMG") {
        const img = doc.querySelector("img");
        if (img) {
          img.setAttribute("alt", altText);
          onApplyEdit(img.outerHTML, true);
        }
      } else if (tagName === "PICTURE" || tagName === "FIGURE") {
        const element = doc.querySelector(tagName.toLowerCase());
        const img = element?.querySelector("img");
        if (img && element) {
          img.setAttribute("alt", altText);
          onApplyEdit(element.outerHTML, true);
        }
      }
    }
  };

  const handleSaveVideoSettings = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      `<div>${selectedElement.outerHtml}</div>`,
      "text/html"
    );

    const video = doc.querySelector("video");
    if (video) {
      if (autoplay) {
        video.setAttribute("autoplay", "");
      } else {
        video.removeAttribute("autoplay");
      }

      if (loop) {
        video.setAttribute("loop", "");
      } else {
        video.removeAttribute("loop");
      }

      if (muted) {
        video.setAttribute("muted", "");
      } else {
        video.removeAttribute("muted");
      }

      onApplyEdit(video.outerHTML, true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-warm-gray-200">
        <div className="flex items-center gap-2">
          {isVideo ? (
            <Video size={18} className="text-purple-600" />
          ) : (
            <ImageIcon size={18} className="text-purple-600" />
          )}
          <div>
            <h3 className="font-medium text-warm-gray-900">Edit Media</h3>
            <p className="text-xs text-warm-gray-500">
              {getElementTypeName(selectedElement.tagName)}
            </p>
          </div>
        </div>
        <button
          onClick={onDeselect}
          className="p-1.5 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-sm] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Current media preview */}
      <div className="p-4 border-b border-warm-gray-200">
        <label className="block text-xs font-medium text-warm-gray-500 mb-2 uppercase tracking-wide">
          Current
        </label>
        <div className="relative aspect-video bg-warm-gray-100 rounded-[--radius-md] overflow-hidden">
          {isVideo ? (
            <video
              src={mediaData.src}
              poster={mediaData.poster}
              className="w-full h-full object-contain"
              controls
            />
          ) : (
            <img
              src={mediaData.src}
              alt={mediaData.alt || ""}
              className="w-full h-full object-contain"
            />
          )}
        </div>
        {mediaData.width && mediaData.height && (
          <p className="text-xs text-warm-gray-500 mt-2">
            {mediaData.width} × {mediaData.height}px
          </p>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border-b border-warm-gray-200"
          >
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-[--radius-md] text-sm text-red-700">
              <AlertCircle size={16} />
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-auto p-1 hover:bg-red-100 rounded"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick actions */}
      <div className="p-4 border-b border-warm-gray-200">
        <label className="block text-xs font-medium text-warm-gray-500 mb-2 uppercase tracking-wide">
          Quick Actions
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRemove}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-[--radius-md] transition-colors"
          >
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      </div>

      {/* Replace media */}
      <div className="p-4 border-b border-warm-gray-200">
        <label className="block text-xs font-medium text-warm-gray-500 mb-2 uppercase tracking-wide">
          Replace
        </label>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-warm-gray-700 bg-warm-gray-50 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {uploading ? "Uploading..." : "Upload New"}
          </button>
          <button
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-warm-gray-700 bg-warm-gray-50 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
          >
            <FolderOpen size={14} />
            From Library
          </button>
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-warm-gray-700 bg-warm-gray-50 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
          >
            <Link size={14} />
            From URL
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={isVideo ? "video/mp4,video/webm" : "image/jpeg,image/png,image/gif,image/webp"}
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />

        {/* URL Input */}
        <AnimatePresence>
          {showUrlInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 text-sm border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="p-2 text-white bg-purple-600 hover:bg-purple-700 rounded-[--radius-md] disabled:opacity-50 transition-colors"
                >
                  <Check size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alt text (for images) */}
      {!isVideo && (
        <div className="p-4 border-b border-warm-gray-200">
          <label className="block text-xs font-medium text-warm-gray-500 mb-2 uppercase tracking-wide">
            Alt Text
          </label>
          <div className="flex items-start gap-2">
            <textarea
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe the image for accessibility..."
              className="flex-1 px-3 py-2 text-sm border border-warm-gray-200 rounded-[--radius-md] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              rows={2}
            />
            <button
              onClick={handleSaveAltText}
              disabled={altText === mediaData.alt}
              className="p-2 text-white bg-purple-600 hover:bg-purple-700 rounded-[--radius-md] disabled:opacity-50 transition-colors"
            >
              <Check size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Video controls */}
      {isVideo && (
        <div className="p-4 border-b border-warm-gray-200">
          <label className="block text-xs font-medium text-warm-gray-500 mb-2 uppercase tracking-wide">
            Video Settings
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-warm-gray-700">
              <input
                type="checkbox"
                checked={autoplay}
                onChange={(e) => setAutoplay(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-warm-gray-300 rounded focus:ring-purple-500"
              />
              Autoplay
            </label>
            <label className="flex items-center gap-2 text-sm text-warm-gray-700">
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-warm-gray-300 rounded focus:ring-purple-500"
              />
              Loop
            </label>
            <label className="flex items-center gap-2 text-sm text-warm-gray-700">
              <input
                type="checkbox"
                checked={muted}
                onChange={(e) => setMuted(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-warm-gray-300 rounded focus:ring-purple-500"
              />
              Muted
            </label>
          </div>
          <button
            onClick={handleSaveVideoSettings}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-[--radius-md] transition-colors"
          >
            <Check size={16} />
            Save Settings
          </button>
        </div>
      )}

      {/* Media Library Modal */}
      <AnimatePresence>
        {showLibrary && (
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
                onSelect={handleMediaSelect}
                selectionMode={true}
                filterType={isVideo ? "video" : "image"}
                onClose={() => setShowLibrary(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

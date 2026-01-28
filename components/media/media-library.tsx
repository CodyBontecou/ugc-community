"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Video,
  Upload,
  Loader2,
  Trash2,
  X,
  Check,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import type { Media } from "@/lib/db/schema";

interface MediaLibraryProps {
  onSelect?: (media: Media) => void;
  selectionMode?: boolean;
  filterType?: "all" | "image" | "video";
  onClose?: () => void;
}

export function MediaLibrary({
  onSelect,
  selectionMode = false,
  filterType = "all",
  onClose,
}: MediaLibraryProps) {
  const [activeTab, setActiveTab] = useState<"all" | "image" | "video">(filterType);
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type: activeTab,
        page: page.toString(),
        limit: "20",
      });

      const response = await fetch(`/api/media?${params}`);
      if (!response.ok) {
        throw new Error("Failed to load media");
      }

      const data = await response.json();
      setItems(data.items);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

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
      }

      // Refresh the list
      setPage(1);
      await fetchMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/media/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const tabs = [
    { id: "all" as const, label: "All", icon: FolderOpen },
    { id: "image" as const, label: "Images", icon: ImageIcon },
    { id: "video" as const, label: "Videos", icon: Video },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-[--radius-lg] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-warm-gray-200">
        <div>
          <h2 className="font-semibold text-warm-gray-900">Media Library</h2>
          <p className="text-xs text-warm-gray-500">
            {selectionMode ? "Select a file to use" : "Manage your uploaded media"}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-sm] transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-warm-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-[--radius-md] transition-colors ${
              activeTab === tab.id
                ? "bg-purple-100 text-purple-700"
                : "text-warm-gray-600 hover:bg-warm-gray-100"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upload Zone */}
      <div className="p-4 border-b border-warm-gray-100">
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[--radius-md] cursor-pointer transition-colors ${
            isDragging
              ? "border-purple-500 bg-purple-50"
              : "border-warm-gray-200 hover:border-warm-gray-300 hover:bg-warm-gray-50"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={24} className="text-purple-500 animate-spin mb-2" />
              <p className="text-sm text-warm-gray-600">{uploadProgress}</p>
            </>
          ) : (
            <>
              <Upload size={24} className="text-warm-gray-400 mb-2" />
              <p className="text-sm text-warm-gray-600">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-warm-gray-400 mt-1">
                Images (up to 10MB) or videos (up to 100MB)
              </p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border-b border-warm-gray-100"
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

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="text-purple-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-warm-gray-500">
            <FolderOpen size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No media uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {items.map((item) => (
              <MediaItem
                key={item.id}
                item={item}
                selectionMode={selectionMode}
                onSelect={onSelect}
                onDelete={(id) => setDeleteConfirm(id)}
                isDeleting={deleteConfirm === item.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-4 border-t border-warm-gray-100">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-3 py-1 text-sm text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-warm-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-3 py-1 text-sm text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-[--radius-lg] p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="font-semibold text-warm-gray-900 mb-2">
                Delete Media?
              </h3>
              <p className="text-sm text-warm-gray-600 mb-4">
                This action cannot be undone. The file will be permanently deleted.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 text-sm text-warm-gray-700 bg-warm-gray-100 hover:bg-warm-gray-200 rounded-[--radius-md] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-[--radius-md] transition-colors"
                >
                  {deleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MediaItemProps {
  item: Media;
  selectionMode?: boolean;
  onSelect?: (media: Media) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function MediaItem({
  item,
  selectionMode,
  onSelect,
  onDelete,
  isDeleting,
}: MediaItemProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`group relative aspect-square bg-warm-gray-100 rounded-[--radius-md] overflow-hidden ${
        selectionMode ? "cursor-pointer" : ""
      } ${isDeleting ? "opacity-50" : ""}`}
      onClick={() => selectionMode && onSelect?.(item)}
    >
      {/* Thumbnail */}
      {item.type === "image" ? (
        <img
          src={item.thumbnailUrl || item.url}
          alt={item.metadata?.alt || item.originalFilename}
          className={`w-full h-full object-cover transition-opacity ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-warm-gray-200">
          <Video size={32} className="text-warm-gray-400" />
        </div>
      )}

      {/* Loading placeholder */}
      {!loaded && item.type === "image" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={20} className="text-warm-gray-400 animate-spin" />
        </div>
      )}

      {/* Hover overlay */}
      <div
        className={`absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity ${
          selectionMode ? "opacity-0 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {selectionMode ? (
          <div className="p-2 bg-white rounded-full">
            <Check size={20} className="text-purple-600" />
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Type badge */}
      <div className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-medium bg-black/50 text-white rounded">
        {item.type === "image" ? "IMG" : "VID"}
      </div>
    </div>
  );
}

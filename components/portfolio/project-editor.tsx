"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Loader2,
  X,
  Plus,
  Image as ImageIcon,
  Video,
  Star,
  GripVertical,
  Trash2,
} from "lucide-react";
import { MediaLibrary } from "@/components/media/media-library";
import type { Media } from "@/lib/db/schema";
import type { PortfolioProject } from "./project-card";

interface ProjectEditorProps {
  project?: PortfolioProject;
  mode: "create" | "edit";
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  title: string;
  brandName: string;
  campaignDescription: string;
  contentType: "sponsored" | "ugc" | "personal" | "collab" | "";
  platforms: string[];
  results: string;
  projectDate: string;
  featured: boolean;
}

interface SelectedMedia {
  id: string;
  media: Media;
  isCover: boolean;
}

const CONTENT_TYPES = [
  { value: "sponsored", label: "Sponsored Content" },
  { value: "ugc", label: "UGC" },
  { value: "personal", label: "Personal Project" },
  { value: "collab", label: "Collaboration" },
];

const PLATFORMS = [
  "TikTok",
  "Instagram",
  "YouTube",
  "Twitter",
  "Facebook",
  "LinkedIn",
  "Pinterest",
  "Snapchat",
];

export function ProjectEditor({
  project,
  mode,
  onClose,
  onSuccess,
}: ProjectEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: project?.title || "",
    brandName: project?.brandName || "",
    campaignDescription: project?.campaignDescription || "",
    contentType: (project?.contentType as FormData["contentType"]) || "",
    platforms: project?.platforms || [],
    results: project?.results || "",
    projectDate: project?.projectDate || "",
    featured: project?.featured || false,
  });

  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>(
    project?.projectMedia.map((pm) => ({
      id: pm.mediaId,
      media: pm.media,
      isCover: pm.isCover,
    })) || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = mode === "create"
        ? "/api/portfolio-projects"
        : `/api/portfolio-projects/${project?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const payload = {
        title: formData.title,
        brandName: formData.brandName || null,
        campaignDescription: formData.campaignDescription || null,
        contentType: formData.contentType || null,
        platforms: formData.platforms.length > 0 ? formData.platforms : null,
        results: formData.results || null,
        projectDate: formData.projectDate || null,
        featured: formData.featured,
        mediaIds: selectedMedia.map((m) => m.id),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const createdProject = await response.json();

        // If editing and media changed, update media separately
        if (mode === "edit" && project) {
          const originalMediaIds = new Set(project.projectMedia.map((pm) => pm.mediaId));
          const newMediaIds = selectedMedia.map((m) => m.id);
          const mediaToAdd = newMediaIds.filter((id) => !originalMediaIds.has(id));
          const mediaToRemove = [...originalMediaIds].filter((id) => !newMediaIds.includes(id));

          // Add new media
          if (mediaToAdd.length > 0) {
            await fetch(`/api/portfolio-projects/${project.id}/media`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mediaIds: mediaToAdd,
                isCover: selectedMedia.find((m) => m.isCover)?.id,
              }),
            });
          }

          // Remove old media
          for (const mediaId of mediaToRemove) {
            await fetch(`/api/portfolio-projects/${project.id}/media/${mediaId}`, {
              method: "DELETE",
            });
          }

          // Reorder media and set cover
          if (selectedMedia.length > 0) {
            await fetch("/api/portfolio-projects/reorder", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId: project.id,
                mediaIds: selectedMedia.map((m) => m.id),
                coverId: selectedMedia.find((m) => m.isCover)?.id,
              }),
            });
          }
        }

        onSuccess?.();
        onClose();
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save project");
      }
    } catch (err) {
      console.error("Error saving project:", err);
      setError("Failed to save project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaSelect = useCallback((media: Media) => {
    setSelectedMedia((prev) => {
      if (prev.some((m) => m.id === media.id)) {
        return prev;
      }
      return [...prev, { id: media.id, media, isCover: prev.length === 0 }];
    });
    setShowMediaPicker(false);
  }, []);

  const handleRemoveMedia = (mediaId: string) => {
    setSelectedMedia((prev) => {
      const filtered = prev.filter((m) => m.id !== mediaId);
      if (filtered.length > 0 && !filtered.some((m) => m.isCover)) {
        filtered[0].isCover = true;
      }
      return filtered;
    });
  };

  const handleSetCover = (mediaId: string) => {
    setSelectedMedia((prev) =>
      prev.map((m) => ({ ...m, isCover: m.id === mediaId }))
    );
  };

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[--radius-lg] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-warm-gray-200">
          <h2 className="font-semibold text-warm-gray-900 text-lg">
            {mode === "create" ? "New Project" : "Edit Project"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-sm] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[--radius-md] p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-warm-gray-700 mb-1">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                maxLength={200}
                className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                placeholder="e.g., Summer Skincare Campaign"
              />
            </div>

            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium text-warm-gray-700 mb-1">
                Brand Name
              </label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, brandName: e.target.value }))
                }
                maxLength={200}
                className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                placeholder="e.g., Glow Skincare Co."
              />
            </div>

            {/* Content Type & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-warm-gray-700 mb-1">
                  Content Type
                </label>
                <select
                  value={formData.contentType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contentType: e.target.value as FormData["contentType"],
                    }))
                  }
                  className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="">Select type...</option>
                  {CONTENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-gray-700 mb-1">
                  Project Date
                </label>
                <input
                  type="date"
                  value={formData.projectDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, projectDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Campaign Description */}
            <div>
              <label className="block text-sm font-medium text-warm-gray-700 mb-1">
                Campaign Description
              </label>
              <textarea
                value={formData.campaignDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    campaignDescription: e.target.value,
                  }))
                }
                maxLength={2000}
                rows={3}
                className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                placeholder="Describe the campaign, your role, and what you created..."
              />
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-medium text-warm-gray-700 mb-1">
                Platforms
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      formData.platforms.includes(platform)
                        ? "bg-purple-500 text-white"
                        : "bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200"
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div>
              <label className="block text-sm font-medium text-warm-gray-700 mb-1">
                Results / Metrics
              </label>
              <input
                type="text"
                value={formData.results}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, results: e.target.value }))
                }
                maxLength={500}
                className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                placeholder="e.g., 2M views, 50K likes, 15% engagement rate"
              />
            </div>

            {/* Featured Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, featured: e.target.checked }))
                }
                className="w-4 h-4 rounded border-warm-gray-300 text-purple-500 focus:ring-purple-500/20"
              />
              <span className="text-sm text-warm-gray-700">
                Feature this project in my portfolio
              </span>
            </label>

            {/* Media Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-warm-gray-700">
                  Project Media
                </label>
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-[--radius-md] transition-colors"
                >
                  <Plus size={16} />
                  Add Media
                </button>
              </div>

              {selectedMedia.length === 0 ? (
                <div
                  onClick={() => setShowMediaPicker(true)}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-warm-gray-200 rounded-[--radius-md] cursor-pointer hover:border-warm-gray-300 hover:bg-warm-gray-50 transition-colors"
                >
                  <ImageIcon size={32} className="text-warm-gray-400 mb-2" />
                  <p className="text-sm text-warm-gray-500">
                    Click to add images or videos
                  </p>
                </div>
              ) : (
                <Reorder.Group
                  axis="x"
                  values={selectedMedia}
                  onReorder={setSelectedMedia}
                  className="flex gap-2 overflow-x-auto pb-2"
                >
                  {selectedMedia.map((item) => (
                    <Reorder.Item
                      key={item.id}
                      value={item}
                      className="relative flex-shrink-0 w-24 h-24 bg-warm-gray-100 rounded-[--radius-md] overflow-hidden cursor-grab active:cursor-grabbing group"
                    >
                      {item.media.type === "image" ? (
                        <img
                          src={item.media.thumbnailUrl || item.media.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-warm-gray-200">
                          <Video size={24} className="text-warm-gray-400" />
                        </div>
                      )}

                      {/* Cover badge */}
                      {item.isCover && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-medium rounded flex items-center gap-0.5">
                          <Star size={10} className="fill-current" />
                          Cover
                        </div>
                      )}

                      {/* Drag handle */}
                      <div className="absolute top-1 right-1 p-0.5 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical size={12} className="text-white" />
                      </div>

                      {/* Actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {!item.isCover && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(item.id)}
                            className="p-1.5 bg-white rounded-full text-amber-500 hover:bg-amber-50"
                            title="Set as cover"
                          >
                            <Star size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(item.id)}
                          className="p-1.5 bg-white rounded-full text-red-500 hover:bg-red-50"
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
              <p className="text-xs text-warm-gray-500 mt-1">
                Drag to reorder. The first image is the cover by default.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-warm-gray-200 bg-warm-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="px-4 py-2 bg-purple-500 text-white font-medium rounded-[--radius-md] hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : mode === "create" ? (
                "Create Project"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Media Picker Modal */}
      <AnimatePresence>
        {showMediaPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-[--radius-lg] w-full max-w-2xl h-[80vh] overflow-hidden"
            >
              <MediaLibrary
                selectionMode={true}
                onSelect={handleMediaSelect}
                onClose={() => setShowMediaPicker(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

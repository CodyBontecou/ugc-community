"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Image as ImageIcon,
  Video,
  MoreVertical,
  Edit2,
  Trash2,
  Star,
  StarOff,
  Calendar,
  Building2,
  Loader2,
} from "lucide-react";
import type { Media } from "@/lib/db/schema";
import { formatDuration, isVideoProcessing } from "@/lib/media/utils";

interface ProjectMedia {
  id: string;
  projectId: string;
  mediaId: string;
  displayOrder: number;
  isCover: boolean;
  media: Media;
}

export interface PortfolioProject {
  id: string;
  userId: string;
  title: string;
  brandName: string | null;
  campaignDescription: string | null;
  contentType: "sponsored" | "ugc" | "personal" | "collab" | null;
  platforms: string[] | null;
  results: string | null;
  projectDate: string | null;
  displayOrder: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  projectMedia: ProjectMedia[];
}

interface ProjectCardProps {
  project: PortfolioProject;
  onEdit: (project: PortfolioProject) => void;
  onDelete: (project: PortfolioProject) => void;
  onToggleFeatured: (project: PortfolioProject) => void;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  sponsored: "Sponsored",
  ugc: "UGC",
  personal: "Personal",
  collab: "Collab",
};

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  onToggleFeatured,
}: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const coverMedia = project.projectMedia.find((pm) => pm.isCover)?.media ??
    project.projectMedia[0]?.media;
  const mediaCount = project.projectMedia.length;
  const imageCount = project.projectMedia.filter((pm) => pm.media.type === "image").length;
  const videoCount = project.projectMedia.filter((pm) => pm.media.type === "video").length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white rounded-[--radius-lg] border border-warm-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Cover Image */}
      <div className="relative aspect-video bg-warm-gray-100">
        {coverMedia ? (
          coverMedia.type === "image" ? (
            <img
              src={coverMedia.thumbnailUrl || coverMedia.url}
              alt={project.title}
              className={`w-full h-full object-cover transition-opacity ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
          ) : coverMedia.thumbnailUrl ? (
            <>
              <img
                src={coverMedia.thumbnailUrl}
                alt={project.title}
                className={`w-full h-full object-cover transition-opacity ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
              {coverMedia.metadata?.duration !== undefined && (
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 text-[10px] font-medium bg-black/70 text-white rounded">
                  {formatDuration(coverMedia.metadata.duration)}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-warm-gray-200">
              <Video size={40} className="text-warm-gray-400" />
              <div className="flex items-center gap-1.5 mt-2">
                <Loader2 size={14} className="text-warm-gray-500 animate-spin" />
                <span className="text-xs text-warm-gray-500">Processing...</span>
              </div>
            </div>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={40} className="text-warm-gray-300" />
          </div>
        )}

        {/* Featured Badge */}
        {project.featured && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
            <Star size={12} className="fill-current" />
            Featured
          </div>
        )}

        {/* Media Count Badge */}
        {mediaCount > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded-md flex items-center gap-2">
            {imageCount > 0 && (
              <span className="flex items-center gap-1">
                <ImageIcon size={12} />
                {imageCount}
              </span>
            )}
            {videoCount > 0 && (
              <span className="flex items-center gap-1">
                <Video size={12} />
                {videoCount}
              </span>
            )}
          </div>
        )}

        {/* Content Type Badge */}
        {project.contentType && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded-md">
            {CONTENT_TYPE_LABELS[project.contentType]}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-warm-gray-900 line-clamp-1">
          {project.title}
        </h3>

        {project.brandName && (
          <p className="text-sm text-warm-gray-600 flex items-center gap-1 mt-1">
            <Building2 size={14} />
            {project.brandName}
          </p>
        )}

        {project.projectDate && (
          <p className="text-xs text-warm-gray-500 flex items-center gap-1 mt-2">
            <Calendar size={12} />
            {new Date(project.projectDate).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </p>
        )}

        {/* Platforms */}
        {project.platforms && project.platforms.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {project.platforms.map((platform) => (
              <span
                key={platform}
                className="px-2 py-0.5 bg-warm-gray-100 text-warm-gray-600 text-xs rounded-full"
              >
                {platform}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions Menu */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical size={16} className="text-warm-gray-600" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-[--radius-md] shadow-lg border border-warm-gray-200 py-1 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-sm text-warm-gray-700 hover:bg-warm-gray-50 flex items-center gap-2"
              >
                <Edit2 size={14} />
                Edit Project
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFeatured(project);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-sm text-warm-gray-700 hover:bg-warm-gray-50 flex items-center gap-2"
              >
                {project.featured ? (
                  <>
                    <StarOff size={14} />
                    Remove Featured
                  </>
                ) : (
                  <>
                    <Star size={14} />
                    Mark Featured
                  </>
                )}
              </button>
              <hr className="my-1 border-warm-gray-100" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Loader2,
  FolderOpen,
  AlertCircle,
  X,
  Trash2,
} from "lucide-react";
import { ProjectCard, type PortfolioProject } from "./project-card";
import { ProjectEditor } from "./project-editor";

interface SortableProjectCardProps {
  project: PortfolioProject;
  onEdit: (project: PortfolioProject) => void;
  onDelete: (project: PortfolioProject) => void;
  onToggleFeatured: (project: PortfolioProject) => void;
}

function SortableProjectCard({
  project,
  onEdit,
  onDelete,
  onToggleFeatured,
}: SortableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <ProjectCard
        project={project}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleFeatured={onToggleFeatured}
      />
    </div>
  );
}

export function ProjectsManager() {
  const router = useRouter();
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<PortfolioProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio-projects");
      if (!response.ok) {
        throw new Error("Failed to load projects");
      }

      const data = await response.json();
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);

      const reorderedProjects = arrayMove(projects, oldIndex, newIndex);
      setProjects(reorderedProjects);

      // Persist the new order
      setIsReordering(true);
      try {
        const response = await fetch("/api/portfolio-projects/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectIds: reorderedProjects.map((p) => p.id),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save order");
        }

        const data = await response.json();
        setProjects(data.projects);
      } catch (err) {
        console.error("Error reordering:", err);
        fetchProjects();
      } finally {
        setIsReordering(false);
      }
    }
  };

  const handleToggleFeatured = async (project: PortfolioProject) => {
    try {
      const response = await fetch(`/api/portfolio-projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !project.featured }),
      });

      if (response.ok) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === project.id ? { ...p, featured: !p.featured } : p
          )
        );
      }
    } catch (err) {
      console.error("Error toggling featured:", err);
    }
  };

  const handleDelete = async (project: PortfolioProject) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/portfolio-projects/${project.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
        setDeleteConfirm(null);
      } else {
        throw new Error("Failed to delete project");
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      setError("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSuccess = () => {
    fetchProjects();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-warm-gray-900">
            Portfolio Projects
          </h2>
          <p className="text-sm text-warm-gray-500 mt-1">
            Organize your work into projects for your AI-generated portfolio
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white font-medium rounded-[--radius-md] hover:bg-purple-600 transition-colors"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
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

      {/* Reordering indicator */}
      {isReordering && (
        <div className="flex items-center gap-2 text-sm text-warm-gray-500">
          <Loader2 size={14} className="animate-spin" />
          Saving order...
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-warm-gray-500">
          <FolderOpen size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm mt-1">
            Create your first project to showcase your work
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-500 text-white font-medium rounded-[--radius-md] hover:bg-purple-600 transition-colors"
          >
            <Plus size={18} />
            Create Project
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={projects.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <SortableProjectCard
                  key={project.id}
                  project={project}
                  onEdit={setEditingProject}
                  onDelete={setDeleteConfirm}
                  onToggleFeatured={handleToggleFeatured}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(isCreating || editingProject) && (
          <ProjectEditor
            project={editingProject ?? undefined}
            mode={editingProject ? "edit" : "create"}
            onClose={() => {
              setIsCreating(false);
              setEditingProject(null);
            }}
            onSuccess={handleSuccess}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-[--radius-lg] p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="font-semibold text-warm-gray-900 mb-2">
                Delete Project?
              </h3>
              <p className="text-sm text-warm-gray-600 mb-4">
                Are you sure you want to delete &ldquo;{deleteConfirm.title}&rdquo;? This
                action cannot be undone.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 text-sm text-warm-gray-700 bg-warm-gray-100 hover:bg-warm-gray-200 rounded-[--radius-md] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-[--radius-md] transition-colors"
                >
                  {isDeleting ? (
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

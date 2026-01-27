"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Layers } from "lucide-react";
import type { SectionInfo } from "@/lib/editor/types";
import { parseSections, reorderSections } from "@/lib/editor/html-element-selector";

interface SectionReordererProps {
  html: string;
  onReorder: (newHtml: string) => void;
  disabled?: boolean;
}

interface SortableItemProps {
  section: SectionInfo;
}

function SortableItem({ section }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border border-warm-gray-200 rounded-[--radius-md] ${
        isDragging ? "shadow-lg border-rose/50 z-10" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-warm-gray-400 hover:text-warm-gray-600 cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-warm-gray-900 text-sm truncate">
          {section.title}
        </div>
        <div className="text-xs text-warm-gray-500 truncate">
          &lt;{section.tagName}&gt;
        </div>
      </div>
    </div>
  );
}

export function SectionReorderer({
  html,
  onReorder,
  disabled = false,
}: SectionReordererProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sections = parseSections(html);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = sections.findIndex((s) => s.id === active.id);
        const newIndex = sections.findIndex((s) => s.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(
            sections.map((_, i) => i),
            oldIndex,
            newIndex
          );
          const newHtml = reorderSections(html, newOrder);
          onReorder(newHtml);
        }
      }
    },
    [sections, html, onReorder]
  );

  if (sections.length <= 1) {
    return null;
  }

  return (
    <div className="border-t border-warm-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="w-full flex items-center justify-between p-4 hover:bg-warm-gray-50 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-warm-gray-500" />
          <span className="font-medium text-warm-gray-900 text-sm">
            Reorder Sections
          </span>
          <span className="text-xs text-warm-gray-500">
            ({sections.length} sections)
          </span>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-warm-gray-400"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 4.5L6 7.5L9 4.5" />
          </svg>
        </motion.span>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 pb-4"
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sections.map((section) => (
                  <SortableItem key={section.id} section={section} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </motion.div>
      )}
    </div>
  );
}

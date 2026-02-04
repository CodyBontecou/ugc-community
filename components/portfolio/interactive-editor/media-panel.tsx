"use client";

import { MediaLibrary } from "@/components/media/media-library";

export function MediaPanel() {
  return (
    <div className="flex-1 min-h-0">
      <MediaLibrary variant="dark" />
    </div>
  );
}

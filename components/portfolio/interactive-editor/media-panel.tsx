"use client";

import { MediaLibrary } from "@/components/media/media-library";

export function MediaPanel() {
  return (
    <div className="flex-1 min-h-0 p-4">
      <div className="h-full">
        <MediaLibrary />
      </div>
    </div>
  );
}

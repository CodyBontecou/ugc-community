/**
 * Format duration in seconds to MM:SS or H:MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1:23" for 83 seconds)
 */
export function formatDuration(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Check if a video is still processing (no thumbnail URL yet)
 */
export function isVideoProcessing(media: {
  type: string;
  thumbnailUrl: string | null;
}): boolean {
  return media.type === "video" && !media.thumbnailUrl;
}

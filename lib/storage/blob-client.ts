import { put, del } from "@vercel/blob";

// Allowed file types and size limits
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
export const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Get file extension from mime type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  return extensions[mimeType] || "bin";
}

/**
 * Generate a pathname for the blob
 * Format: {userId}/{timestamp}-{filename}.{ext}
 * @param overrideExtension - Optional extension to use instead of deriving from mimeType
 */
export function generatePathname(
  userId: string,
  originalFilename: string,
  mimeType: string,
  overrideExtension?: string
): string {
  const timestamp = Date.now();
  const ext = overrideExtension || getExtensionFromMimeType(mimeType);
  // Sanitize filename - remove extension and special chars
  const baseName = originalFilename
    .replace(/\.[^/.]+$/, "") // remove extension
    .replace(/[^a-zA-Z0-9-_]/g, "-") // replace special chars
    .substring(0, 50); // limit length
  return `${userId}/${timestamp}-${baseName}.${ext}`;
}

/**
 * Check if a mime type is an image type that should be converted to WebP
 */
export function shouldConvertToWebP(mimeType: string): boolean {
  // Convert JPEG and PNG to WebP; GIF and WebP stay as-is
  return mimeType === "image/jpeg" || mimeType === "image/png";
}

/**
 * Validate file type and size
 */
export function validateFile(
  mimeType: string,
  size: number
): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid file type: ${mimeType}. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
    };
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

  if (size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File too large. Maximum size for ${isImage ? "images" : "videos"} is ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Get media type from mime type
 */
export function getMediaType(mimeType: string): "image" | "video" {
  return ALLOWED_IMAGE_TYPES.includes(mimeType) ? "image" : "video";
}

/**
 * Upload a file to Vercel Blob
 */
export async function uploadToBlob(
  pathname: string,
  body: Buffer | Blob,
  contentType: string
): Promise<{ url: string; pathname: string }> {
  const blob = await put(pathname, body, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });
  return { url: blob.url, pathname: blob.pathname };
}

/**
 * Delete a file from Vercel Blob
 */
export async function deleteFromBlob(url: string): Promise<void> {
  await del(url);
}

/**
 * Generate a thumbnail pathname from an original pathname
 * Adds '-thumb' suffix before the extension
 */
export function generateThumbnailPathname(originalPathname: string): string {
  const lastDot = originalPathname.lastIndexOf(".");
  if (lastDot === -1) {
    return `${originalPathname}-thumb`;
  }
  return `${originalPathname.slice(0, lastDot)}-thumb${originalPathname.slice(lastDot)}`;
}

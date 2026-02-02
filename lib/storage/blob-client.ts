import { put, del, list } from "@vercel/blob";

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
 * Generate a unique storage path for a file
 * Format: media/{userId}/{timestamp}-{uuid}.{ext}
 */
export function generateStoragePath(userId: string, mimeType: string): string {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const ext = getExtensionFromMimeType(mimeType);
  return `media/${userId}/${timestamp}-${uuid}.${ext}`;
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
 * Returns the public URL of the uploaded file
 */
export async function uploadToBlob(
  pathname: string,
  body: Buffer | Blob | File | ReadableStream,
  mimeType: string
): Promise<{ url: string; pathname: string }> {
  const blob = await put(pathname, body, {
    access: "public",
    contentType: mimeType,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
  };
}

/**
 * Delete a file from Vercel Blob
 */
export async function deleteFromBlob(url: string): Promise<void> {
  await del(url);
}

/**
 * List files in Vercel Blob (for a specific prefix/folder)
 */
export async function listBlobs(prefix?: string) {
  const { blobs } = await list({ prefix });
  return blobs;
}

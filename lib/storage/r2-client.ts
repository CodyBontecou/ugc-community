import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

// R2 Configuration from environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "ugc-media";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://media.ugc.community

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PUBLIC_URL);
}

/**
 * Get the R2 client, throwing a clear error if not configured
 */
function getR2Client(): S3Client {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error(
      "R2 storage is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_PUBLIC_URL in your environment variables."
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

// Lazily initialized R2 client
let _r2Client: S3Client | null = null;

function getOrCreateR2Client(): S3Client {
  if (!_r2Client) {
    _r2Client = getR2Client();
  }
  return _r2Client;
}

export const r2Client = new Proxy({} as S3Client, {
  get(_, prop) {
    const client = getOrCreateR2Client();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

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
 * Generate a unique storage key for a file
 * Format: {userId}/{timestamp}-{uuid}.{ext}
 */
export function generateStorageKey(
  userId: string,
  mimeType: string
): string {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const ext = getExtensionFromMimeType(mimeType);
  return `${userId}/${timestamp}-${uuid}.${ext}`;
}

/**
 * Get the public URL for a stored file
 */
export function getPublicUrl(key: string): string {
  if (!R2_PUBLIC_URL) {
    throw new Error("R2_PUBLIC_URL is not configured in environment variables.");
  }
  return `${R2_PUBLIC_URL}/${key}`;
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
 * Upload a file to R2
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  mimeType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: mimeType,
  });

  await r2Client.send(command);
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Get a file from R2 (for thumbnails, etc.)
 */
export async function getFromR2(
  key: string
): Promise<{ body: ReadableStream | null; contentType: string | undefined }> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const response = await r2Client.send(command);
  return {
    body: response.Body?.transformToWebStream() || null,
    contentType: response.ContentType,
  };
}

/**
 * Extract storage key from public URL
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!R2_PUBLIC_URL || !url.startsWith(R2_PUBLIC_URL)) {
    return null;
  }
  return url.replace(`${R2_PUBLIC_URL}/`, "");
}

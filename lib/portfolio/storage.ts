/**
 * Portfolio Blob Storage Layer
 *
 * Manages portfolio files in Vercel Blob under `portfolios/{subdomain}/`.
 * Deterministic paths (no random suffix) allow overwrites on re-generation.
 */

import { put, del, list } from "@vercel/blob";

// =====================================================
// Types
// =====================================================

/** Matches the GeneratedFile type from portfolio-generator.ts */
export interface PortfolioFile {
  path: string;
  content: string;
  /** If true, content is base64-encoded binary data */
  isBinary?: boolean;
}

export interface UploadResult {
  subdomain: string;
  filesUploaded: number;
  urls: Record<string, string>; // filename -> blob URL
}

// =====================================================
// Content-Type Mapping
// =====================================================

const CONTENT_TYPE_MAP: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

/**
 * Get Content-Type for a file based on its extension.
 */
export function getContentType(filePath: string): string {
  const ext = filePath.includes(".")
    ? `.${filePath.split(".").pop()!.toLowerCase()}`
    : "";
  return CONTENT_TYPE_MAP[ext] || "application/octet-stream";
}

// =====================================================
// Path Helpers
// =====================================================

/**
 * Build the blob storage path for a portfolio file.
 * Pattern: `portfolios/{subdomain}/{filename}`
 */
function buildBlobPath(subdomain: string, filePath: string): string {
  // Normalize: strip leading slashes/dots from file path
  const normalized = filePath.replace(/^[./]+/, "");
  return `portfolios/${subdomain}/${normalized}`;
}

/**
 * Build the blob prefix for listing all files in a portfolio.
 */
function buildBlobPrefix(subdomain: string): string {
  return `portfolios/${subdomain}/`;
}

// =====================================================
// Storage Functions
// =====================================================

/**
 * Upload all portfolio files for a subdomain to Vercel Blob.
 * Overwrites existing files (deterministic paths, no random suffix).
 */
export async function uploadPortfolio(
  subdomain: string,
  files: PortfolioFile[]
): Promise<UploadResult> {
  const urls: Record<string, string> = {};

  // Upload all files in parallel
  const uploads = files.map(async (file) => {
    const blobPath = buildBlobPath(subdomain, file.path);
    const contentType = getContentType(file.path);

    // Convert content to appropriate format
    let body: Buffer | string;
    if (file.isBinary) {
      // Binary files (favicons, images) are base64-encoded
      body = Buffer.from(file.content, "base64");
    } else {
      body = file.content;
    }

    const blob = await put(blobPath, body, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });

    urls[file.path] = blob.url;
  });

  await Promise.all(uploads);

  return {
    subdomain,
    filesUploaded: files.length,
    urls,
  };
}

/**
 * Delete all portfolio files for a subdomain from Vercel Blob.
 */
export async function deletePortfolio(subdomain: string): Promise<number> {
  const prefix = buildBlobPrefix(subdomain);
  let deletedCount = 0;

  // List all blobs under the prefix and delete them
  let cursor: string | undefined;
  do {
    const result = await list({ prefix, cursor });
    if (result.blobs.length > 0) {
      // del() accepts an array of URLs
      await del(result.blobs.map((blob) => blob.url));
      deletedCount += result.blobs.length;
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return deletedCount;
}

/**
 * Get the Vercel Blob URL for a specific portfolio file.
 * Returns null if the file doesn't exist.
 */
export async function getPortfolioFileUrl(
  subdomain: string,
  filePath: string
): Promise<string | null> {
  const prefix = buildBlobPath(subdomain, filePath);

  // List with exact prefix — should return 0 or 1 results
  const result = await list({ prefix, limit: 1 });
  const blob = result.blobs.find((b) => b.pathname === prefix);

  return blob?.url ?? null;
}

/**
 * Check if a portfolio has any files in Vercel Blob.
 */
export async function portfolioExists(subdomain: string): Promise<boolean> {
  const prefix = buildBlobPrefix(subdomain);
  const result = await list({ prefix, limit: 1 });
  return result.blobs.length > 0;
}

/**
 * List all files in a portfolio.
 * Returns an array of { pathname, url, size, uploadedAt }.
 */
export async function listPortfolioFiles(
  subdomain: string
): Promise<Array<{ pathname: string; url: string; size: number; uploadedAt: Date }>> {
  const prefix = buildBlobPrefix(subdomain);
  const files: Array<{ pathname: string; url: string; size: number; uploadedAt: Date }> = [];

  let cursor: string | undefined;
  do {
    const result = await list({ prefix, cursor });
    for (const blob of result.blobs) {
      files.push({
        pathname: blob.pathname,
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      });
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return files;
}

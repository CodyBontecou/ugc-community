import JSZip from "jszip";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  uploadPortfolio,
  deletePortfolio,
  type PortfolioFile,
} from "@/lib/portfolio/storage";

// =====================================================
// Types
// =====================================================

export interface UploadInputFile {
  name: string;
  size: number;
  data: Buffer;
}

export interface UploadPortfolioForUserInput {
  userId: string;
  files: UploadInputFile[];
  replaceExisting?: boolean;
}

export interface UploadPortfolioForUserResult {
  success: true;
  subdomain: string;
  filesUploaded: number;
  filesDeleted: number;
  skippedFiles?: string[];
  siteUrl: string;
  uploadedFiles: string[];
}

export class PortfolioUploadError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(
    status: number,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "PortfolioUploadError";
    this.status = status;
    this.details = details;
  }

  toResponseBody() {
    return {
      error: this.message,
      ...(this.details ?? {}),
    };
  }
}

// =====================================================
// Constants
// =====================================================

/** Max total upload size: 50 MB */
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

/** Allowed file extensions for individual files */
const ALLOWED_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".js",
  ".json",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".webmanifest",
  ".xml",
  ".txt",
]);

/** Binary file extensions (uploaded as base64) */
const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
]);

// =====================================================
// Helpers
// =====================================================

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

function isAllowedFile(filename: string): boolean {
  // Skip hidden files and __MACOSX junk
  if (filename.startsWith(".") || filename.includes("__MACOSX")) return false;
  const ext = getExtension(filename);
  return ALLOWED_EXTENSIONS.has(ext);
}

function isBinaryFile(filename: string): boolean {
  return BINARY_EXTENSIONS.has(getExtension(filename));
}

/**
 * Strip a common root directory prefix from zip entries.
 * e.g. if all files are under "portfolio/", strip that prefix.
 */
function stripCommonPrefix(paths: string[]): Map<string, string> {
  if (paths.length === 0) return new Map();

  // Find common directory prefix
  const parts = paths.map((p) => p.split("/"));
  let commonParts: string[] = [];

  if (parts.length > 0) {
    commonParts = [...parts[0]];
    for (let i = 1; i < parts.length; i++) {
      let j = 0;
      while (
        j < commonParts.length &&
        j < parts[i].length &&
        commonParts[j] === parts[i][j]
      ) {
        j++;
      }
      commonParts = commonParts.slice(0, j);
    }
  }

  // Only strip directory-level prefixes (not the filename itself)
  // Check that the common prefix is actually a directory
  const prefixLength = commonParts.length;
  const result = new Map<string, string>();

  for (const p of paths) {
    const stripped = p.split("/").slice(prefixLength).join("/");
    if (stripped) {
      result.set(p, stripped);
    }
  }

  return result;
}

async function buildPortfolioFiles(files: UploadInputFile[]): Promise<{
  portfolioFiles: PortfolioFile[];
  skippedFiles: string[];
}> {
  const portfolioFiles: PortfolioFile[] = [];
  const skippedFiles: string[] = [];

  for (const file of files) {
    const ext = getExtension(file.name);

    if (ext === ".zip") {
      // Extract zip contents
      const zip = await JSZip.loadAsync(file.data);

      // Collect all file paths (non-directory entries)
      const zipPaths: string[] = [];
      zip.forEach((relativePath, entry) => {
        if (!entry.dir) {
          zipPaths.push(relativePath);
        }
      });

      // Strip common directory prefix
      const pathMap = stripCommonPrefix(zipPaths);

      for (const [originalPath, strippedPath] of pathMap) {
        if (!isAllowedFile(strippedPath)) {
          skippedFiles.push(strippedPath);
          continue;
        }

        const entry = zip.file(originalPath);
        if (!entry) continue;

        if (isBinaryFile(strippedPath)) {
          const buffer = await entry.async("nodebuffer");
          portfolioFiles.push({
            path: strippedPath,
            content: buffer.toString("base64"),
            isBinary: true,
          });
        } else {
          const content = await entry.async("string");
          portfolioFiles.push({
            path: strippedPath,
            content,
          });
        }
      }
    } else {
      // Individual file upload
      if (!isAllowedFile(file.name)) {
        skippedFiles.push(file.name);
        continue;
      }

      if (isBinaryFile(file.name)) {
        portfolioFiles.push({
          path: file.name,
          content: file.data.toString("base64"),
          isBinary: true,
        });
      } else {
        portfolioFiles.push({
          path: file.name,
          content: file.data.toString("utf8"),
        });
      }
    }
  }

  return { portfolioFiles, skippedFiles };
}

// =====================================================
// Public API
// =====================================================

export async function uploadPortfolioForUser({
  userId,
  files,
  replaceExisting = false,
}: UploadPortfolioForUserInput): Promise<UploadPortfolioForUserResult> {
  // 1. Load user and validate subdomain exists
  const [user] = await db
    .select({
      id: users.id,
      subdomain: users.subdomain,
      siteEnabled: users.siteEnabled,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new PortfolioUploadError(404, "User not found");
  }

  if (!user.subdomain) {
    throw new PortfolioUploadError(
      400,
      "User does not have a subdomain configured. Set a subdomain first."
    );
  }

  // 2. Validate files
  if (files.length === 0) {
    throw new PortfolioUploadError(400, "No files provided");
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    throw new PortfolioUploadError(
      400,
      `Total upload size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds maximum of ${MAX_TOTAL_SIZE / 1024 / 1024}MB`
    );
  }

  // 3. Process files — handle zip or individual files
  const { portfolioFiles, skippedFiles } = await buildPortfolioFiles(files);

  if (portfolioFiles.length === 0) {
    throw new PortfolioUploadError(400, "No valid portfolio files found in upload", {
      skippedFiles,
    });
  }

  // 4. Validate we have at least an index.html
  const hasIndex = portfolioFiles.some(
    (f) => f.path === "index.html" || f.path.endsWith("/index.html")
  );
  if (!hasIndex) {
    throw new PortfolioUploadError(
      400,
      "Upload must include an index.html file. Found files: " +
        portfolioFiles.map((f) => f.path).join(", ")
    );
  }

  // 5. Optionally delete existing portfolio files
  let deletedCount = 0;
  if (replaceExisting) {
    deletedCount = await deletePortfolio(user.subdomain);
  }

  // 6. Upload to Vercel Blob
  const result = await uploadPortfolio(user.subdomain, portfolioFiles);

  // 7. Enable site if not already enabled
  if (!user.siteEnabled) {
    await db
      .update(users)
      .set({ siteEnabled: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  return {
    success: true,
    subdomain: user.subdomain,
    filesUploaded: result.filesUploaded,
    filesDeleted: deletedCount,
    skippedFiles: skippedFiles.length > 0 ? skippedFiles : undefined,
    siteUrl: `https://${user.subdomain}.ugc.community`,
    uploadedFiles: portfolioFiles.map((f) => f.path),
  };
}

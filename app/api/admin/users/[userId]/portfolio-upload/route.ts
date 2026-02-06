/**
 * Portfolio Upload API — Admin drag-and-drop upload
 *
 * POST /api/admin/users/[userId]/portfolio-upload
 *
 * Accepts a multipart form upload of portfolio files (HTML, CSS, JS, images, etc.)
 * and deploys them to Vercel Blob under `portfolios/{subdomain}/`.
 *
 * Optionally accepts a single .zip file which is extracted automatically.
 *
 * Requires admin auth and that the user has a subdomain configured.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  uploadPortfolio,
  deletePortfolio,
  type PortfolioFile,
} from "@/lib/portfolio/storage";
import JSZip from "jszip";

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

// =====================================================
// Route Handler
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 1. Auth check
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await params;

    // 2. Load user and validate subdomain exists
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        subdomain: users.subdomain,
        siteEnabled: users.siteEnabled,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.subdomain) {
      return NextResponse.json(
        { error: "User does not have a subdomain configured. Set a subdomain first." },
        { status: 400 }
      );
    }

    // 3. Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const replaceExisting = formData.get("replace") === "true";

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // 4. Check total size
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        {
          error: `Total upload size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds maximum of ${MAX_TOTAL_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // 5. Process files — handle zip or individual files
    const portfolioFiles: PortfolioFile[] = [];
    const skippedFiles: string[] = [];

    for (const file of files) {
      const ext = getExtension(file.name);

      if (ext === ".zip") {
        // Extract zip contents
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

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
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          portfolioFiles.push({
            path: file.name,
            content: buffer.toString("base64"),
            isBinary: true,
          });
        } else {
          const content = await file.text();
          portfolioFiles.push({
            path: file.name,
            content,
          });
        }
      }
    }

    if (portfolioFiles.length === 0) {
      return NextResponse.json(
        {
          error: "No valid portfolio files found in upload",
          skippedFiles,
        },
        { status: 400 }
      );
    }

    // 6. Validate we have at least an index.html
    const hasIndex = portfolioFiles.some(
      (f) => f.path === "index.html" || f.path.endsWith("/index.html")
    );
    if (!hasIndex) {
      return NextResponse.json(
        {
          error:
            "Upload must include an index.html file. Found files: " +
            portfolioFiles.map((f) => f.path).join(", "),
        },
        { status: 400 }
      );
    }

    // 7. Optionally delete existing portfolio files
    let deletedCount = 0;
    if (replaceExisting) {
      deletedCount = await deletePortfolio(user.subdomain);
    }

    // 8. Upload to Vercel Blob
    const result = await uploadPortfolio(user.subdomain, portfolioFiles);

    // 9. Enable site if not already enabled
    if (!user.siteEnabled) {
      await db
        .update(users)
        .set({ siteEnabled: true, updatedAt: new Date() })
        .where(eq(users.id, userId));
    }

    return NextResponse.json({
      success: true,
      subdomain: user.subdomain,
      filesUploaded: result.filesUploaded,
      filesDeleted: deletedCount,
      skippedFiles: skippedFiles.length > 0 ? skippedFiles : undefined,
      siteUrl: `https://${user.subdomain}.ugc.community`,
      uploadedFiles: portfolioFiles.map((f) => f.path),
    });
  } catch (error) {
    console.error("Portfolio upload error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload portfolio",
      },
      { status: 500 }
    );
  }
}

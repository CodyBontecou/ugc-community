/**
 * Admin User Files API
 *
 * GET /api/admin/users/[userId]/files
 *
 * Lists all files hosted for a user: portfolio site files (Vercel Blob)
 * and media library files (database + Vercel Blob).
 *
 * DELETE /api/admin/users/[userId]/files
 *
 * Deletes a specific file by source + identifier.
 * Body: { source: "portfolio" | "media", path?: string, id?: string }
 *
 * PUT /api/admin/users/[userId]/files
 *
 * Updates the content of a text-based portfolio file.
 * Body: { path: string, content: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users, media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { listPortfolioFiles, getPortfolioFileUrl } from "@/lib/portfolio/storage";
import { put, del } from "@vercel/blob";
import { deleteFromBlob } from "@/lib/storage/blob-client";

// =====================================================
// Text file extensions (editable in the browser)
// =====================================================
const TEXT_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".js",
  ".json",
  ".svg",
  ".xml",
  ".txt",
  ".webmanifest",
]);

function isTextFile(filename: string): boolean {
  const ext = filename.includes(".")
    ? `.${filename.split(".").pop()!.toLowerCase()}`
    : "";
  return TEXT_EXTENSIONS.has(ext);
}

function getFileCategory(filename: string): string {
  const ext = filename.includes(".")
    ? `.${filename.split(".").pop()!.toLowerCase()}`
    : "";

  if ([".html"].includes(ext)) return "markup";
  if ([".css"].includes(ext)) return "style";
  if ([".js"].includes(ext)) return "script";
  if ([".json", ".webmanifest", ".xml"].includes(ext)) return "data";
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico"].includes(ext))
    return "image";
  if ([".woff", ".woff2", ".ttf"].includes(ext)) return "font";
  if ([".txt"].includes(ext)) return "text";
  return "other";
}

// =====================================================
// GET — List all user files
// =====================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId } = await params;

    // Load user
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Portfolio files (from Vercel Blob)
    const portfolioFiles = user.subdomain
      ? (await listPortfolioFiles(user.subdomain)).map((f) => {
          // Strip the "portfolios/{subdomain}/" prefix from pathname
          const prefix = `portfolios/${user.subdomain}/`;
          const relativePath = f.pathname.startsWith(prefix)
            ? f.pathname.slice(prefix.length)
            : f.pathname;

          return {
            source: "portfolio" as const,
            path: relativePath,
            fullPath: f.pathname,
            url: f.url,
            size: f.size,
            uploadedAt: f.uploadedAt.toISOString(),
            editable: isTextFile(relativePath),
            category: getFileCategory(relativePath),
          };
        })
      : [];

    // 2. Media files (from database)
    const mediaFiles = await db
      .select({
        id: media.id,
        filename: media.filename,
        originalFilename: media.originalFilename,
        mimeType: media.mimeType,
        size: media.size,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
        type: media.type,
        createdAt: media.createdAt,
      })
      .from(media)
      .where(eq(media.userId, userId));

    const mediaFilesFormatted = mediaFiles.map((m) => ({
      source: "media" as const,
      id: m.id,
      path: m.originalFilename,
      filename: m.filename,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl,
      size: m.size,
      mimeType: m.mimeType,
      mediaType: m.type,
      uploadedAt: m.createdAt.toISOString(),
      editable: false,
      category: m.type === "video" ? "video" : "image",
    }));

    return NextResponse.json({
      portfolio: portfolioFiles,
      media: mediaFilesFormatted,
      subdomain: user.subdomain,
      siteEnabled: user.siteEnabled,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing user files:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}

// =====================================================
// PUT — Update text file content (portfolio files only)
// =====================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { path, content } = body as { path: string; content: string };

    if (!path || content === undefined) {
      return NextResponse.json(
        { error: "path and content are required" },
        { status: 400 }
      );
    }

    // Load user
    const [user] = await db
      .select({ id: users.id, subdomain: users.subdomain })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.subdomain) {
      return NextResponse.json(
        { error: "User not found or no subdomain configured" },
        { status: 404 }
      );
    }

    // Validate this is a text file
    if (!isTextFile(path)) {
      return NextResponse.json(
        { error: "Only text files can be edited" },
        { status: 400 }
      );
    }

    // Build the blob path and upload the new content
    const blobPath = `portfolios/${user.subdomain}/${path}`;
    const ext = path.includes(".") ? `.${path.split(".").pop()!.toLowerCase()}` : "";

    const contentTypeMap: Record<string, string> = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml",
      ".xml": "application/xml",
      ".txt": "text/plain; charset=utf-8",
      ".webmanifest": "application/manifest+json; charset=utf-8",
    };

    await put(blobPath, content, {
      access: "public",
      contentType: contentTypeMap[ext] || "text/plain; charset=utf-8",
      addRandomSuffix: false,
    });

    return NextResponse.json({ success: true, path });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating file:", error);
    return NextResponse.json({ error: "Failed to update file" }, { status: 500 });
  }
}

// =====================================================
// DELETE — Delete a specific file
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { source, path, id, url } = body as {
      source: "portfolio" | "media";
      path?: string;
      id?: string;
      url?: string;
    };

    if (source === "portfolio") {
      if (!url) {
        return NextResponse.json({ error: "url is required for portfolio files" }, { status: 400 });
      }

      // Delete from Vercel Blob by URL
      await del(url);

      return NextResponse.json({ success: true, deleted: path });
    }

    if (source === "media") {
      if (!id) {
        return NextResponse.json({ error: "id is required for media files" }, { status: 400 });
      }

      // Find the media record
      const [mediaItem] = await db
        .select({ id: media.id, url: media.url, userId: media.userId })
        .from(media)
        .where(eq(media.id, id))
        .limit(1);

      if (!mediaItem || mediaItem.userId !== userId) {
        return NextResponse.json({ error: "Media not found" }, { status: 404 });
      }

      // Delete from Vercel Blob
      try {
        await deleteFromBlob(mediaItem.url);
      } catch (blobError) {
        console.error("Failed to delete media blob:", blobError);
      }

      // Delete from database
      await db.delete(media).where(eq(media.id, id));

      return NextResponse.json({ success: true, deleted: id });
    }

    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}

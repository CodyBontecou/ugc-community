/**
 * Portfolio Serving Route
 *
 * Fetches portfolio files from Vercel Blob, applies serve-time platform
 * injections, and serves with correct Content-Type and Cache-Control headers.
 *
 * Route: /api/portfolio-serve/[subdomain]/[...path]
 * Middleware rewrites `johndoe.ugc.community/styles.css` →
 *   `/api/portfolio-serve/johndoe/styles.css`
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getPortfolioFileUrl, getContentType } from "@/lib/portfolio/storage";
import {
  injectPlatformCode,
  getContactFormHandler,
} from "@/lib/portfolio/platform-injections";

// =====================================================
// Subdomain Lookup Cache (in-memory LRU)
// =====================================================

type CachedCreator = {
  exists: boolean;
  siteEnabled: boolean;
  userId: string | null;
  cachedAt: number;
};

const CREATOR_CACHE = new Map<string, CachedCreator>();
const CACHE_TTL_MS = 60_000; // 1 minute
const CACHE_MAX_SIZE = 500;

/**
 * Look up a creator by subdomain with short-lived in-memory caching.
 * Prevents redundant DB queries when a single page load triggers
 * multiple asset requests (html, css, js, favicon).
 */
async function lookupCreator(subdomain: string): Promise<CachedCreator> {
  const now = Date.now();
  const cached = CREATOR_CACHE.get(subdomain);

  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  // Query DB
  const [creator] = await db
    .select({
      id: users.id,
      siteEnabled: users.siteEnabled,
    })
    .from(users)
    .where(eq(users.subdomain, subdomain))
    .limit(1);

  const result: CachedCreator = {
    exists: !!creator,
    siteEnabled: creator?.siteEnabled ?? false,
    userId: creator?.id ?? null,
    cachedAt: now,
  };

  // Evict oldest entries if cache is full
  if (CREATOR_CACHE.size >= CACHE_MAX_SIZE) {
    const firstKey = CREATOR_CACHE.keys().next().value;
    if (firstKey) CREATOR_CACHE.delete(firstKey);
  }

  CREATOR_CACHE.set(subdomain, result);
  return result;
}

// =====================================================
// Cache-Control Helpers
// =====================================================

function getCacheControl(filePath: string): string {
  const ext = filePath.includes(".")
    ? `.${filePath.split(".").pop()!.toLowerCase()}`
    : "";

  switch (ext) {
    case ".html":
      // Short cache — allows platform injection updates to propagate
      return "public, max-age=3600, stale-while-revalidate=60";
    case ".css":
    case ".js":
      // Medium cache — portfolio content changes less often
      return "public, max-age=86400, stale-while-revalidate=3600";
    case ".png":
    case ".ico":
    case ".jpg":
    case ".jpeg":
    case ".gif":
    case ".webp":
    case ".svg":
    case ".woff":
    case ".woff2":
    case ".ttf":
      // Long cache — static assets rarely change
      return "public, max-age=604800, stale-while-revalidate=86400";
    default:
      return "public, max-age=3600";
  }
}

// =====================================================
// Route Handler
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string; path: string[] }> }
) {
  const { subdomain, path: pathSegments } = await params;

  // Build file path from segments, default to index.html
  const filePath =
    pathSegments && pathSegments.length > 0
      ? pathSegments.join("/")
      : "index.html";

  // 1. Look up creator (cached)
  const creator = await lookupCreator(subdomain);

  if (!creator.exists || !creator.siteEnabled) {
    return new NextResponse("Portfolio not found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 2. Get blob URL for the file
  const blobUrl = await getPortfolioFileUrl(subdomain, filePath);

  if (!blobUrl) {
    return new NextResponse("File not found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 3. Fetch raw file from Vercel Blob
  const blobResponse = await fetch(blobUrl);

  if (!blobResponse.ok) {
    return new NextResponse("File not found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 4. Determine content type and cache headers
  const contentType = getContentType(filePath);
  const cacheControl = getCacheControl(filePath);
  const ext = filePath.includes(".")
    ? `.${filePath.split(".").pop()!.toLowerCase()}`
    : "";

  // 5. Apply serve-time injections based on file type
  if (ext === ".html") {
    // HTML files: inject platform code (tracking pixel, head tags, etc.)
    const rawHtml = await blobResponse.text();
    const injectedHtml = injectPlatformCode(rawHtml, subdomain);

    return new NextResponse(injectedHtml, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
    });
  }

  if (filePath === "script.js" || filePath.endsWith("/script.js")) {
    // Main script file: append contact form handler
    const rawJs = await blobResponse.text();
    const contactHandler = getContactFormHandler(subdomain);
    const injectedJs = rawJs + "\n" + contactHandler;

    return new NextResponse(injectedJs, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
    });
  }

  // 6. All other files: pass through directly (stream for efficiency)
  return new NextResponse(blobResponse.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    },
  });
}

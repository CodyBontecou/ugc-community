import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, portfolioViewDedupe, viewHistory } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { createHash } from "crypto";

function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

const DEDUP_WINDOW_HOURS = 24;
const SUBDOMAIN_ALIASES: Readonly<Record<string, string>> = {
  dany: "daniela",
  danielabontecou: "daniela",
};
const REFERRAL_SOURCES = new Set([
  "chatgpt",
  "perplexity",
  "claude",
  "copilot",
  "gemini",
  "direct",
  "other",
]);

// 1x1 transparent GIF for tracking pixel
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function getCorsHeaders(origin: string | null): Record<string, string> {
  // Allow requests from any *.ugc.community subdomain
  const allowedOriginPattern = /^https?:\/\/([a-z0-9-]+\.)?ugc\.community$/i;

  if (origin && allowedOriginPattern.test(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }

  // For development, also allow localhost
  if (origin && /^https?:\/\/localhost(:\d+)?$/i.test(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }

  return {};
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function normalizeSubdomain(value: string): string {
  const normalized = value.toLowerCase();
  return SUBDOMAIN_ALIASES[normalized] || normalized;
}

function extractReferralSource(request: NextRequest): string {
  const value = request.nextUrl.searchParams.get("source")?.toLowerCase();
  return value && REFERRAL_SOURCES.has(value) ? value : "other";
}

// Extract subdomain from Origin, Referer, or explicit parameter
function extractSubdomain(request: NextRequest): string | null {
  const urlSubdomain = request.nextUrl.searchParams.get("subdomain");
  if (urlSubdomain) return normalizeSubdomain(urlSubdomain);

  const origin = request.headers.get("origin");
  if (origin) {
    const match = origin.match(/^https?:\/\/([a-z0-9-]+)\.ugc\.community$/i);
    if (match) return normalizeSubdomain(match[1]);
  }

  const referer = request.headers.get("referer");
  if (referer) {
    const match = referer.match(/^https?:\/\/([a-z0-9-]+)\.ugc\.community/i);
    if (match) return normalizeSubdomain(match[1]);
  }

  return null;
}

async function trackView(request: NextRequest): Promise<{ success: boolean; subdomain?: string; source?: string; deduplicated?: boolean }> {
  const subdomain = extractSubdomain(request);
  const source = extractReferralSource(request);

  if (!subdomain) {
    console.log("Portfolio view tracking: no subdomain found");
    return { success: false, source };
  }

  // Get IP for logging (hashed for privacy)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const hashedIp = hashIp(ip);

  try {
    // First, look up the user ID from subdomain
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.subdomain, subdomain))
      .limit(1);

    if (userResult.length === 0) {
      console.log(`Portfolio view tracking: subdomain not found: ${subdomain}`);
      return { success: false, subdomain, source };
    }

    const userId = userResult[0].id;

    // Calculate dedup window cutoff
    const windowCutoff = new Date(
      Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000
    );

    // Check for existing view within dedup window
    const existingView = await db
      .select({ id: portfolioViewDedupe.id })
      .from(portfolioViewDedupe)
      .where(
        and(
          eq(portfolioViewDedupe.userId, userId),
          eq(portfolioViewDedupe.ipHash, hashedIp),
          gte(portfolioViewDedupe.viewedAt, windowCutoff)
        )
      )
      .limit(1);

    if (existingView.length > 0) {
      // Already counted this view recently
      console.log(
        JSON.stringify({ event: "portfolio_view_deduplicated", subdomain, source, ipHash: hashedIp })
      );
      return { success: true, subdomain, source, deduplicated: true };
    }

    // Increment count and record the view in a transaction
    const today = getTodayDateString();
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          portfolioViewCount: sql`${users.portfolioViewCount} + 1`,
        })
        .where(eq(users.id, userId));

      // Record this view for deduplication
      await tx.insert(portfolioViewDedupe).values({
        userId,
        ipHash: hashedIp,
      });

      // Upsert daily view count for analytics
      await tx
        .insert(viewHistory)
        .values({
          userId,
          date: today,
          portfolioViews: 1,
          profileViews: 0,
        })
        .onConflictDoUpdate({
          target: [viewHistory.userId, viewHistory.date],
          set: {
            portfolioViews: sql`${viewHistory.portfolioViews} + 1`,
          },
        });
    });

    console.log(JSON.stringify({ event: "portfolio_view", subdomain, source, ipHash: hashedIp }));
    return { success: true, subdomain, source };
  } catch (error) {
    console.error("Error tracking portfolio view:", error);
    return { success: false, subdomain, source };
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

// GET /api/portfolio/track - Tracking pixel (returns 1x1 transparent GIF)
// Usage: <img src="https://ugc.community/api/portfolio/track" width="1" height="1" />
// Or with explicit subdomain: <img src="https://ugc.community/api/portfolio/track?subdomain=username" />
export async function GET(request: NextRequest) {
  // Track the view (fire-and-forget)
  await trackView(request);

  // Return tracking pixel
  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

// POST /api/portfolio/track - JSON response for script-based tracking
// Usage: fetch('https://ugc.community/api/portfolio/track', { method: 'POST' })
// Or with explicit subdomain: fetch('https://ugc.community/api/portfolio/track?subdomain=username', { method: 'POST' })
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  const result = await trackView(request);

  return NextResponse.json(result, { headers: corsHeaders });
}

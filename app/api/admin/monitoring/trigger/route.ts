import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import {
  scrapeAllPlatforms,
  scrapeAllProfiles,
  getAllPlatformHandles,
  type PlatformScrapeResult,
} from "@/lib/hashtag-monitoring/profile-scraper";
import { processScrapedPosts } from "@/lib/hashtag-monitoring/handler";

export interface TriggerResponse {
  success: boolean;
  scrape: {
    platforms: Array<{
      platform: string;
      totalHandles: number;
      scraped: number;
      skipped: number;
      postsFound: number;
    }>;
    totalScraped: number;
    totalSkipped: number;
    totalPostsFound: number;
  };
  processing: {
    saved: number;
    duplicates: number;
    matched: number;
  };
  errors?: string[];
}

/**
 * POST /api/admin/monitoring/trigger
 *
 * Manually trigger profile-based scraping via Scrape Creators API.
 * Optionally specify a platform, otherwise triggers all platforms.
 *
 * Body (optional):
 * - platform: "instagram" | "tiktok" - specific platform to trigger
 */
export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Parse optional body
    let platform: string | undefined;
    try {
      const body = await request.json();
      platform = body.platform;
    } catch {
      // No body or invalid JSON - trigger all platforms
    }

    let scrapeResults: PlatformScrapeResult[];

    if (platform === "tiktok" || platform === "instagram") {
      const result = await scrapeAllProfiles(platform);
      scrapeResults = [result];
    } else {
      scrapeResults = await scrapeAllPlatforms();
    }

    // Process all new posts through the handler
    const allNewPosts = scrapeResults.flatMap((r) =>
      r.results.flatMap((sr) => sr.newPosts)
    );

    let processingResult = {
      savedCount: 0,
      duplicateCount: 0,
      matchedCount: 0,
      errors: [] as string[],
    };

    if (allNewPosts.length > 0) {
      processingResult = await processScrapedPosts(allNewPosts);
    }

    const totalScraped = scrapeResults.reduce((s, r) => s + r.scraped, 0);
    const totalSkipped = scrapeResults.reduce((s, r) => s + r.skipped, 0);
    const totalPostsFound = scrapeResults.reduce(
      (s, r) => s + r.postsFound,
      0
    );
    const allErrors = [
      ...scrapeResults.flatMap((r) => r.errors),
      ...processingResult.errors,
    ];

    const response: TriggerResponse = {
      success: allErrors.length === 0,
      scrape: {
        platforms: scrapeResults.map((r) => ({
          platform: r.platform,
          totalHandles: r.totalHandles,
          scraped: r.scraped,
          skipped: r.skipped,
          postsFound: r.postsFound,
        })),
        totalScraped,
        totalSkipped,
        totalPostsFound,
      },
      processing: {
        saved: processingResult.savedCount,
        duplicates: processingResult.duplicateCount,
        matched: processingResult.matchedCount,
      },
      errors: allErrors.length > 0 ? allErrors : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error triggering monitoring:", error);
    return NextResponse.json(
      { error: "Failed to trigger monitoring" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/monitoring/trigger
 *
 * Get information about what would be scraped (handles per platform)
 */
export async function GET() {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const platformHandles = await getAllPlatformHandles();

    return NextResponse.json({
      platforms: platformHandles.map((p) => ({
        platform: p.platform,
        handleCount: p.handles.length,
        handles: p.handles.map((h) => h.handle),
      })),
      totalHandles: platformHandles.reduce(
        (sum, p) => sum + p.handles.length,
        0
      ),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching monitoring info:", error);
    return NextResponse.json(
      { error: "Failed to fetch monitoring info" },
      { status: 500 }
    );
  }
}

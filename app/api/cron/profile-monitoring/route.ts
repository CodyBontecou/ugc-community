import { NextRequest, NextResponse } from "next/server";
import {
  scrapeAllPlatforms,
  getAllPlatformHandles,
} from "@/lib/hashtag-monitoring/profile-scraper";
import { processScrapedPosts } from "@/lib/hashtag-monitoring/handler";

/**
 * GET /api/cron/profile-monitoring
 *
 * Cron job to scrape registered user profiles via Scrape Creators API.
 * Uses a two-step approach:
 *   1. PEEK: Check profile video/post count (1 credit per user)
 *   2. FETCH: Only fetch posts if count increased (saves credits)
 *
 * Then processes any new posts through the mention-matching pipeline.
 *
 * Schedule: Runs every 12 hours (6 AM and 6 PM UTC)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Log what we're about to scrape
    const platformHandles = await getAllPlatformHandles();
    const totalHandles = platformHandles.reduce(
      (sum, p) => sum + p.handles.length,
      0
    );

    console.log(
      `[ProfileMonitoring] Cron started. Platforms: ${platformHandles.length}, Total handles: ${totalHandles}`
    );
    for (const { platform, handles } of platformHandles) {
      console.log(`  ${platform}: ${handles.length} handles`);
    }

    // Step 1: Scrape all profiles (peek + conditional fetch)
    const scrapeResults = await scrapeAllPlatforms();

    // Step 2: Collect all new posts and process them through the handler
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
      console.log(
        `[ProfileMonitoring] Processing ${allNewPosts.length} new posts through handler...`
      );
      processingResult = await processScrapedPosts(allNewPosts);
    }

    // Build summary
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

    console.log(
      `[ProfileMonitoring] Cron complete. Scraped: ${totalScraped}, Skipped: ${totalSkipped}, Posts found: ${totalPostsFound}, Saved: ${processingResult.savedCount}, Matched: ${processingResult.matchedCount}`
    );

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("[ProfileMonitoring] Cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

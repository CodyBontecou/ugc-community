import { NextRequest, NextResponse } from "next/server";
import {
  triggerAllProfileScrapers,
  getAllPlatformHandles,
} from "@/lib/hashtag-monitoring/profile-scraper";

/**
 * GET /api/cron/profile-monitoring
 *
 * Weekly cron job to trigger profile-based scraping for all registered users.
 * This checks Instagram and TikTok profiles for posts containing #ugccommunity.
 *
 * Schedule: Runs every Sunday at 6 AM UTC (configured in vercel.json)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get platform handles for logging
    const platformHandles = await getAllPlatformHandles();
    const totalHandles = platformHandles.reduce(
      (sum, p) => sum + p.handles.length,
      0
    );

    console.log(
      `Profile monitoring cron started. Platforms: ${platformHandles.length}, Total handles: ${totalHandles}`
    );

    // Log handles per platform
    for (const { platform, handles } of platformHandles) {
      console.log(`  ${platform}: ${handles.length} handles`);
    }

    // Trigger profile scrapers for all platforms
    const results = await triggerAllProfileScrapers();

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    // Log results
    for (const result of results) {
      if (result.success) {
        console.log(`  ${result.platform}: Started run ${result.runId}`);
      } else {
        console.error(`  ${result.platform}: Failed - ${result.error}`);
      }
    }

    console.log(
      `Profile monitoring cron completed. Success: ${successCount}, Failed: ${failureCount}`
    );

    return NextResponse.json({
      success: failureCount === 0,
      results,
      summary: {
        totalPlatforms: results.length,
        successCount,
        failureCount,
        totalHandles,
      },
    });
  } catch (error) {
    console.error("Error in profile monitoring cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

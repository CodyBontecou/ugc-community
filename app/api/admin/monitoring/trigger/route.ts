import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import {
  triggerAllProfileScrapers,
  triggerProfileScraper,
  getAllPlatformHandles,
  type TriggerResult,
} from "@/lib/hashtag-monitoring/profile-scraper";

export interface TriggerResponse {
  success: boolean;
  results: TriggerResult[];
  summary: {
    totalPlatforms: number;
    successCount: number;
    failureCount: number;
    totalHandles: number;
  };
}

/**
 * POST /api/admin/monitoring/trigger
 *
 * Manually trigger profile-based scraping for registered users.
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

    let results: TriggerResult[];
    const platformHandles = await getAllPlatformHandles();

    if (platform) {
      // Trigger specific platform
      const handles = platformHandles.find((p) => p.platform === platform);
      if (!handles) {
        return NextResponse.json(
          { error: `No registered users with ${platform} handles` },
          { status: 400 }
        );
      }
      const result = await triggerProfileScraper(
        platform as "instagram" | "tiktok",
        handles.handles
      );
      results = [result];
    } else {
      // Trigger all platforms
      results = await triggerAllProfileScrapers();
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;
    const totalHandles = platformHandles.reduce(
      (sum, p) => sum + p.handles.length,
      0
    );

    const response: TriggerResponse = {
      success: failureCount === 0,
      results,
      summary: {
        totalPlatforms: results.length,
        successCount,
        failureCount,
        totalHandles,
      },
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
        handles: p.handles,
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

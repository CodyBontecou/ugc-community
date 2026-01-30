import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { processIncomingPosts } from "@/lib/hashtag-monitoring/handler";
import "@/lib/hashtag-monitoring/providers";

const APIFY_API_BASE = "https://api.apify.com/v2";

/**
 * POST /api/admin/monitoring/reprocess
 *
 * Manually reprocess an Apify dataset to extract and match posts.
 * Useful when webhooks fail or for debugging.
 *
 * Body:
 * - datasetId: The Apify dataset ID to reprocess
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

    const { datasetId } = await request.json();

    if (!datasetId) {
      return NextResponse.json(
        { error: "datasetId is required" },
        { status: 400 }
      );
    }

    // Fetch dataset items from Apify
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "APIFY_API_TOKEN not configured" },
        { status: 500 }
      );
    }

    const datasetResponse = await fetch(
      `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${token}`
    );

    if (!datasetResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch dataset: ${datasetResponse.status} ${datasetResponse.statusText}` },
        { status: 400 }
      );
    }

    const items = await datasetResponse.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Dataset is empty or invalid" },
        { status: 400 }
      );
    }

    // Create a webhook-like payload for processing
    const payload = {
      eventType: "ACTOR.RUN.SUCCEEDED",
      eventData: {
        actorId: "manual-reprocess",
        actorRunId: `reprocess-${Date.now()}`,
      },
      resource: {
        defaultDatasetId: datasetId,
      },
    };

    // Process the posts through our normal handler
    const result = await processIncomingPosts("apify", payload, {});

    return NextResponse.json({
      success: result.success,
      itemsInDataset: items.length,
      saved: result.savedCount,
      duplicates: result.duplicateCount,
      matched: result.matchedCount,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error reprocessing dataset:", error);
    return NextResponse.json(
      { error: "Failed to reprocess dataset" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/monitoring/reprocess
 *
 * Get recent Apify runs with their dataset IDs for easy reprocessing
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

    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "APIFY_API_TOKEN not configured" },
        { status: 500 }
      );
    }

    // Fetch recent runs
    const runsResponse = await fetch(
      `${APIFY_API_BASE}/actor-runs?token=${token}&limit=10&desc=true`
    );

    if (!runsResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch runs from Apify" },
        { status: 500 }
      );
    }

    const runsData = await runsResponse.json();

    const runs = runsData.data?.items?.map((run: Record<string, unknown>) => ({
      id: run.id,
      actorId: run.actId,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      datasetId: run.defaultDatasetId,
      origin: (run.meta as Record<string, unknown>)?.origin,
    })) || [];

    return NextResponse.json({ runs });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}

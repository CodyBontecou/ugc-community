/**
 * Dynamic Webhook Endpoint for Hashtag Monitoring Providers
 *
 * Routes: POST /api/webhooks/hashtag-monitor/[provider]
 * Example: POST /api/webhooks/hashtag-monitor/apify
 *
 * Each provider must be registered before it can receive webhooks.
 */

import { NextRequest, NextResponse } from "next/server";
import { getProvider, hasProvider } from "@/lib/hashtag-monitoring";
import { processIncomingPosts } from "@/lib/hashtag-monitoring/handler";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerName } = await params;

  // Check if provider exists
  if (!hasProvider(providerName)) {
    return NextResponse.json(
      { error: `Unknown provider: ${providerName}` },
      { status: 404 }
    );
  }

  // Get the provider for optional webhook verification
  const provider = getProvider(providerName);

  // Get headers for verification
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Get raw body for signature verification
  const rawBody = await request.text();

  // Verify webhook if provider supports it
  if (provider?.verifyWebhook) {
    const isValid = provider.verifyWebhook(rawBody, headers);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }
  }

  // Parse the payload
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // Process the posts
  const result = await processIncomingPosts(providerName, payload, headers);

  // Return appropriate status
  if (!result.success && result.savedCount === 0) {
    return NextResponse.json(
      {
        success: false,
        errors: result.errors,
      },
      { status: 422 }
    );
  }

  return NextResponse.json({
    success: true,
    saved: result.savedCount,
    duplicates: result.duplicateCount,
    matched: result.matchedCount,
    errors: result.errors.length > 0 ? result.errors : undefined,
  });
}

// Health check endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerName } = await params;

  if (!hasProvider(providerName)) {
    return NextResponse.json(
      { error: `Unknown provider: ${providerName}` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    provider: providerName,
    status: "ready",
  });
}

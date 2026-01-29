import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { createHash } from "crypto";

function getCorsHeaders(origin: string | null): Record<string, string> {
  // Allow requests from any *.ugc.community subdomain
  const allowedOriginPattern = /^https?:\/\/([a-z0-9-]+\.)?ugc\.community$/i;

  if (origin && allowedOriginPattern.test(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }

  // For development, also allow localhost
  if (origin && /^https?:\/\/localhost(:\d+)?$/i.test(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }

  return {};
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

// POST /api/portfolio/[id]/view - Track a portfolio view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get IP for logging (hashed for privacy)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const hashedIp = hashIp(ip);

    // Increment the portfolio view count atomically
    const result = await db
      .update(users)
      .set({
        portfolioViewCount: sql`${users.portfolioViewCount} + 1`,
      })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (result.length === 0) {
      // User not found - fail silently for fire-and-forget pattern
      return NextResponse.json(
        { success: false },
        { status: 404, headers: corsHeaders }
      );
    }

    // Log for debugging (IP is hashed)
    console.log(`Portfolio view tracked: user=${id}, ip_hash=${hashedIp}`);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error tracking portfolio view:", error);
    // Return success to support fire-and-forget pattern
    return NextResponse.json({ success: false }, { status: 500, headers: corsHeaders });
  }
}

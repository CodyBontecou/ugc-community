import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolios, portfolioViews, creatorDirectory } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { createHash } from "crypto";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth/session";

// Hash IP address for privacy
function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").substring(0, 16);
}

// POST /api/portfolio/[id]/view - Record a portfolio view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: portfolioId } = await params;

    // Get the portfolio to verify it exists
    const portfolio = await db.query.portfolios.findFirst({
      where: eq(portfolios.id, portfolioId),
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Check if the viewer is the portfolio owner (don't count own views)
    const session = await getServerSession();
    if (session?.user.id === portfolio.userId) {
      return NextResponse.json({ counted: false, reason: "own_portfolio" });
    }

    // Get request metadata
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
    const userAgent = headersList.get("user-agent") || undefined;
    const referrer = headersList.get("referer") || undefined;

    const ipHash = hashIp(ip);

    // Check for duplicate views (same IP within 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentView = await db.query.portfolioViews.findFirst({
      where: and(
        eq(portfolioViews.portfolioId, portfolioId),
        eq(portfolioViews.viewerIpHash, ipHash),
        gte(portfolioViews.createdAt, twentyFourHoursAgo)
      ),
    });

    if (recentView) {
      return NextResponse.json({ counted: false, reason: "duplicate" });
    }

    // Insert the view record
    await db.insert(portfolioViews).values({
      portfolioId,
      viewerIpHash: ipHash,
      userAgent,
      referrer,
    });

    // Increment the denormalized view count in creatorDirectory
    await db
      .update(creatorDirectory)
      .set({
        portfolioViews: sql`${creatorDirectory.portfolioViews} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(creatorDirectory.portfolioId, portfolioId));

    return NextResponse.json({ counted: true });
  } catch (error) {
    console.error("Error recording portfolio view:", error);
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    );
  }
}

// GET /api/portfolio/[id]/view - Get view count for a portfolio
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: portfolioId } = await params;

    // Get total view count from portfolioViews table
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(portfolioViews)
      .where(eq(portfolioViews.portfolioId, portfolioId));

    const totalViews = result[0]?.count ?? 0;

    return NextResponse.json({ views: totalViews });
  } catch (error) {
    console.error("Error fetching view count:", error);
    return NextResponse.json(
      { error: "Failed to fetch view count" },
      { status: 500 }
    );
  }
}

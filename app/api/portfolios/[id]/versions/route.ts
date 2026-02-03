import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { portfolios, portfolioVersions } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/portfolios/[id]/versions - Get all versions for a portfolio
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: portfolioId } = await params;

    // Verify portfolio ownership
    const portfolio = await db.query.portfolios.findFirst({
      where: and(
        eq(portfolios.id, portfolioId),
        eq(portfolios.userId, session.user.id)
      ),
    });

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    // Get all versions, ordered by version number descending
    const versions = await db.query.portfolioVersions.findMany({
      where: eq(portfolioVersions.portfolioId, portfolioId),
      orderBy: [desc(portfolioVersions.versionNumber)],
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}

// POST /api/portfolios/[id]/versions - Create a new version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: portfolioId } = await params;
    const body = await request.json();
    const { htmlContent, title } = body;

    if (!htmlContent) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    // Verify portfolio ownership
    const portfolio = await db.query.portfolios.findFirst({
      where: and(
        eq(portfolios.id, portfolioId),
        eq(portfolios.userId, session.user.id)
      ),
    });

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    // Get the latest version number
    const latestVersion = await db.query.portfolioVersions.findFirst({
      where: eq(portfolioVersions.portfolioId, portfolioId),
      orderBy: [desc(portfolioVersions.versionNumber)],
    });

    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Create the new version
    const [newVersion] = await db
      .insert(portfolioVersions)
      .values({
        portfolioId,
        htmlContent,
        versionNumber: newVersionNumber,
        title: title || null,
      })
      .returning();

    return NextResponse.json({ version: newVersion }, { status: 201 });
  } catch (error) {
    console.error("Error creating version:", error);
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    );
  }
}

/**
 * Admin File Content API
 *
 * GET /api/admin/users/[userId]/files/content?path=index.html
 *
 * Fetches the raw text content of a portfolio file for editing.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPortfolioFileUrl } from "@/lib/portfolio/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json({ error: "path query parameter is required" }, { status: 400 });
    }

    // Load user
    const [user] = await db
      .select({ id: users.id, subdomain: users.subdomain })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.subdomain) {
      return NextResponse.json({ error: "User not found or no subdomain" }, { status: 404 });
    }

    // Get the blob URL for this file
    const blobUrl = await getPortfolioFileUrl(user.subdomain, filePath);
    if (!blobUrl) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Fetch the file content
    const response = await fetch(blobUrl, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch file content" }, { status: 500 });
    }

    const content = await response.text();

    return NextResponse.json({ content, path: filePath });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching file content:", error);
    return NextResponse.json({ error: "Failed to fetch file content" }, { status: 500 });
  }
}

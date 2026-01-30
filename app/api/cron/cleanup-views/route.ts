import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolioViewDedupe } from "@/lib/db/schema";
import { lt, sql } from "drizzle-orm";

const RETENTION_DAYS = 7;

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Calculate cutoff date (7 days ago)
    const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // Delete old records
    const result = await db
      .delete(portfolioViewDedupe)
      .where(lt(portfolioViewDedupe.viewedAt, cutoffDate))
      .returning({ id: portfolioViewDedupe.id });

    const deletedCount = result.length;

    console.log(
      `Cleanup completed: deleted ${deletedCount} portfolio_view_dedupe records older than ${cutoffDate.toISOString()}`
    );

    return NextResponse.json({
      success: true,
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error("Error cleaning up portfolio views:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

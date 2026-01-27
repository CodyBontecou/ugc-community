import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const updateHtmlSchema = z.object({
  htmlContent: z.string().min(1),
});

// PATCH /api/portfolios/[id]/html - Update portfolio HTML content
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Validate portfolio ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid portfolio ID" },
        { status: 400 }
      );
    }

    // Check ownership
    const portfolio = await db.query.portfolios.findFirst({
      where: and(
        eq(portfolios.id, id),
        eq(portfolios.userId, session.user.id)
      ),
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Validate request body
    const body = await request.json();
    const { htmlContent } = updateHtmlSchema.parse(body);

    // Validate HTML starts correctly
    if (!htmlContent.trim().toLowerCase().startsWith("<!doctype html")) {
      return NextResponse.json(
        { error: "Invalid HTML: must start with <!DOCTYPE html>" },
        { status: 400 }
      );
    }

    // Update the portfolio HTML
    const [updated] = await db
      .update(portfolios)
      .set({
        htmlContent,
        updatedAt: new Date(),
      })
      .where(eq(portfolios.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      portfolio: {
        id: updated.id,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error updating portfolio HTML:", error);
    return NextResponse.json(
      { error: "Failed to update portfolio" },
      { status: 500 }
    );
  }
}

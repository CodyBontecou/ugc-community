import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updatePortfolioSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  tagline: z.string().max(200).optional(),
  templateId: z.string().optional(),
  theme: z.record(z.unknown()).optional(),
  isPublished: z.boolean().optional(),
  htmlContent: z.string().optional(),
});

// GET /api/portfolio - Get user's portfolio
export async function GET() {
  try {
    const session = await requireAuth();

    const portfolio = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, session.user.id),
      with: {
        sections: {
          orderBy: (sections, { asc }) => [asc(sections.order)],
        },
        media: true,
      },
    });

    // Return null if no portfolio exists - client handles redirect
    if (!portfolio) {
      return NextResponse.json(null);
    }

    return NextResponse.json(portfolio);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching portfolio:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}

// PATCH /api/portfolio - Update user's portfolio (creates if doesn't exist)
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const data = updatePortfolioSchema.parse(body);

    // Get user's portfolio
    const existing = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, session.user.id),
    });

    // If no portfolio exists, create one
    if (!existing) {
      const [created] = await db
        .insert(portfolios)
        .values({
          userId: session.user.id,
          title: data.title || "My Portfolio",
          tagline: data.tagline || "",
          templateId: data.templateId || "default",
          theme: data.theme || {},
          htmlContent: data.htmlContent || null,
          portfolioType: data.htmlContent ? "html" : "json",
          isPublished: data.isPublished || false,
          publishedAt: data.isPublished ? new Date() : null,
          content: {
            headline: data.title || "My Portfolio",
            subheadline: data.tagline || "",
          },
        })
        .returning();

      return NextResponse.json(created, { status: 201 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.tagline !== undefined) updateData.tagline = data.tagline;
    if (data.templateId !== undefined) updateData.templateId = data.templateId;
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.htmlContent !== undefined) updateData.htmlContent = data.htmlContent;

    // Handle publishing
    if (data.isPublished !== undefined) {
      updateData.isPublished = data.isPublished;
      if (data.isPublished && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const [updated] = await db
      .update(portfolios)
      .set(updateData)
      .where(eq(portfolios.id, existing.id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating portfolio:", error);
    return NextResponse.json(
      { error: "Failed to update portfolio" },
      { status: 500 }
    );
  }
}

// DELETE /api/portfolio - Delete user's portfolio
export async function DELETE() {
  try {
    const session = await requireAuth();

    const existing = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, session.user.id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Delete portfolio (cascades to sections)
    await db.delete(portfolios).where(eq(portfolios.id, existing.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting portfolio:", error);
    return NextResponse.json(
      { error: "Failed to delete portfolio" },
      { status: 500 }
    );
  }
}

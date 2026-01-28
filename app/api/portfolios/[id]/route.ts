import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updatePortfolioSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  tagline: z.string().max(200).optional(),
  templateId: z.string().optional(),
  theme: z.record(z.unknown()).optional(),
  content: z.record(z.unknown()).optional(),
  isPublished: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/portfolios/[id] - Get user's portfolio (ID verified for ownership)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const portfolio = await db.query.portfolios.findFirst({
      where: and(eq(portfolios.id, id), eq(portfolios.userId, session.user.id)),
      with: {
        sections: {
          orderBy: (sections, { asc }) => [asc(sections.order)],
        },
        media: true,
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
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

// PATCH /api/portfolios/[id] - Update user's portfolio
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const data = updatePortfolioSchema.parse(body);

    // Verify ownership
    const existing = await db.query.portfolios.findFirst({
      where: and(eq(portfolios.id, id), eq(portfolios.userId, session.user.id)),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.tagline !== undefined) updateData.tagline = data.tagline;
    if (data.templateId !== undefined) updateData.templateId = data.templateId;
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.content !== undefined) updateData.content = data.content;

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
      .where(eq(portfolios.id, id))
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

// DELETE /api/portfolios/[id] - Delete user's portfolio
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Verify ownership
    const existing = await db.query.portfolios.findFirst({
      where: and(eq(portfolios.id, id), eq(portfolios.userId, session.user.id)),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Delete portfolio (cascades to sections)
    await db.delete(portfolios).where(eq(portfolios.id, id));

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

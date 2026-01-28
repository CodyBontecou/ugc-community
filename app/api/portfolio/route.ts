import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolios, portfolioSections } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updatePortfolioSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  tagline: z.string().max(200).optional(),
  templateId: z.string().optional(),
  theme: z.record(z.unknown()).optional(),
  content: z.record(z.unknown()).optional(),
  isPublished: z.boolean().optional(),
  htmlContent: z.string().optional(),
  portfolioType: z.enum(["json", "html"]).optional(),
});

/**
 * Creates a new portfolio with default sections for the user
 */
async function createDefaultPortfolio(userId: string, userName?: string) {
  const title = userName ? `${userName}'s Portfolio` : "My Portfolio";

  const [portfolio] = await db
    .insert(portfolios)
    .values({
      userId,
      title,
      tagline: "Creator & Content Specialist",
      templateId: "default",
      portfolioType: "json",
      content: {
        headline: title,
        subheadline: "Creator & Content Specialist",
      },
    })
    .returning();

  // Create default sections
  const defaultSections = [
    {
      portfolioId: portfolio.id,
      type: "hero",
      order: 0,
      content: {
        title: title,
        subtitle: "Welcome to my portfolio",
      },
    },
    {
      portfolioId: portfolio.id,
      type: "about",
      order: 1,
      content: {
        title: "About Me",
        body: "Tell brands about yourself and what makes you unique.",
      },
    },
    {
      portfolioId: portfolio.id,
      type: "work",
      order: 2,
      content: {
        title: "My Work",
        items: [],
      },
    },
    {
      portfolioId: portfolio.id,
      type: "contact",
      order: 3,
      content: {
        title: "Let's Work Together",
        ctaText: "Get in Touch",
      },
    },
  ];

  await db.insert(portfolioSections).values(defaultSections);

  return portfolio;
}

// GET /api/portfolio - Get user's portfolio (auto-create if doesn't exist)
export async function GET() {
  try {
    const session = await requireAuth();

    let portfolio = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, session.user.id),
      with: {
        sections: {
          orderBy: (sections, { asc }) => [asc(sections.order)],
        },
        media: true,
      },
    });

    // Auto-create portfolio if user doesn't have one
    if (!portfolio) {
      const newPortfolio = await createDefaultPortfolio(
        session.user.id,
        session.user.name
      );

      portfolio = await db.query.portfolios.findFirst({
        where: eq(portfolios.id, newPortfolio.id),
        with: {
          sections: {
            orderBy: (sections, { asc }) => [asc(sections.order)],
          },
          media: true,
        },
      });
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

// PATCH /api/portfolio - Update user's portfolio
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const data = updatePortfolioSchema.parse(body);

    // Get user's portfolio
    const existing = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, session.user.id),
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
    if (data.htmlContent !== undefined) updateData.htmlContent = data.htmlContent;
    if (data.portfolioType !== undefined) updateData.portfolioType = data.portfolioType;

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

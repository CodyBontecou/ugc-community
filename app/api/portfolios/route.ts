import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolios, portfolioSections } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createPortfolioSchema = z.object({
  title: z.string().min(1).max(100),
  tagline: z.string().max(200).optional(),
  templateId: z.string().default("default"),
  htmlContent: z.string().optional(),
  portfolioType: z.enum(["json", "html"]).default("json"),
});

// GET /api/portfolios - Returns user's single portfolio as an array for backwards compatibility
export async function GET() {
  try {
    const session = await requireAuth();

    const portfolio = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, session.user.id),
      with: {
        sections: {
          orderBy: (sections, { asc }) => [asc(sections.order)],
        },
      },
    });

    // Return array for backwards compatibility
    return NextResponse.json(portfolio ? [portfolio] : []);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching portfolios:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolios" },
      { status: 500 }
    );
  }
}

// POST /api/portfolios - Create or update user's portfolio (only one allowed)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Check if user already has a portfolio
    const existing = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, session.user.id),
    });

    if (existing) {
      return NextResponse.json(
        { error: "User already has a portfolio. Use PATCH /api/portfolio to update." },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { title, tagline, templateId, htmlContent, portfolioType } =
      createPortfolioSchema.parse(body);

    // Create portfolio
    const [portfolio] = await db
      .insert(portfolios)
      .values({
        userId: session.user.id,
        title,
        tagline,
        templateId,
        htmlContent: portfolioType === "html" ? htmlContent : null,
        portfolioType,
        content: {
          headline: title,
          subheadline: tagline || "",
        },
      })
      .returning();

    // For HTML portfolios, skip creating default sections
    if (portfolioType === "html") {
      return NextResponse.json(portfolio, { status: 201 });
    }

    // Create default sections for JSON portfolios
    const defaultSections = [
      {
        portfolioId: portfolio.id,
        type: "hero",
        order: 0,
        content: {
          title: title,
          subtitle: tagline || "Welcome to my portfolio",
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

    // Fetch the complete portfolio with sections
    const completePortfolio = await db.query.portfolios.findFirst({
      where: eq(portfolios.id, portfolio.id),
      with: {
        sections: {
          orderBy: (sections, { asc }) => [asc(sections.order)],
        },
      },
    });

    return NextResponse.json(completePortfolio, { status: 201 });
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
    console.error("Error creating portfolio:", error);
    return NextResponse.json(
      { error: "Failed to create portfolio" },
      { status: 500 }
    );
  }
}

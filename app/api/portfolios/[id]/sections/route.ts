import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolios, portfolioSections } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const createSectionSchema = z.object({
  type: z.string().min(1),
  order: z.number().int().min(0),
  content: z.record(z.unknown()).default({}),
  styles: z.record(z.unknown()).default({}),
  isVisible: z.boolean().default(true),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/portfolios/[id]/sections - Get sections for a portfolio
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Verify portfolio ownership
    const portfolio = await db.query.portfolios.findFirst({
      where: and(eq(portfolios.id, id), eq(portfolios.userId, session.user.id)),
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    const sections = await db.query.portfolioSections.findMany({
      where: eq(portfolioSections.portfolioId, id),
      orderBy: (sections, { asc }) => [asc(sections.order)],
    });

    return NextResponse.json(sections);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
}

const updateSectionSchema = z.object({
  sectionId: z.string().uuid(),
  content: z.record(z.unknown()).optional(),
  styles: z.record(z.unknown()).optional(),
  isVisible: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

// PATCH /api/portfolios/[id]/sections - Update an existing section
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Verify portfolio ownership
    const portfolio = await db.query.portfolios.findFirst({
      where: and(eq(portfolios.id, id), eq(portfolios.userId, session.user.id)),
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { sectionId, content, styles, isVisible, order } =
      updateSectionSchema.parse(body);

    // Verify section belongs to this portfolio
    const existingSection = await db.query.portfolioSections.findFirst({
      where: and(
        eq(portfolioSections.id, sectionId),
        eq(portfolioSections.portfolioId, id)
      ),
    });

    if (!existingSection) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (content !== undefined) updates.content = content;
    if (styles !== undefined) updates.styles = styles;
    if (isVisible !== undefined) updates.isVisible = isVisible;
    if (order !== undefined) updates.order = order;

    const [updatedSection] = await db
      .update(portfolioSections)
      .set(updates)
      .where(eq(portfolioSections.id, sectionId))
      .returning();

    // Update portfolio's updatedAt
    await db
      .update(portfolios)
      .set({ updatedAt: new Date() })
      .where(eq(portfolios.id, id));

    return NextResponse.json(updatedSection);
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
    console.error("Error updating section:", error);
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    );
  }
}

// POST /api/portfolios/[id]/sections - Add a new section
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Verify portfolio ownership
    const portfolio = await db.query.portfolios.findFirst({
      where: and(eq(portfolios.id, id), eq(portfolios.userId, session.user.id)),
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = createSectionSchema.parse(body);

    const [section] = await db
      .insert(portfolioSections)
      .values({
        portfolioId: id,
        type: data.type,
        order: data.order,
        content: data.content,
        styles: data.styles,
        isVisible: data.isVisible,
      })
      .returning();

    // Update portfolio's updatedAt
    await db
      .update(portfolios)
      .set({ updatedAt: new Date() })
      .where(eq(portfolios.id, id));

    return NextResponse.json(section, { status: 201 });
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
    console.error("Error creating section:", error);
    return NextResponse.json(
      { error: "Failed to create section" },
      { status: 500 }
    );
  }
}

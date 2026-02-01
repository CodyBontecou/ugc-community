import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolioProjects, portfolioProjectMedia } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

// GET /api/portfolio-projects/[id] - Get a single project with media
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const project = await db.query.portfolioProjects.findFirst({
      where: and(
        eq(portfolioProjects.id, id),
        eq(portfolioProjects.userId, session.user.id)
      ),
      with: {
        projectMedia: {
          orderBy: [asc(portfolioProjectMedia.displayOrder)],
          with: {
            media: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching portfolio project:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio project" },
      { status: 500 }
    );
  }
}

const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  brandName: z.string().max(200).optional().nullable(),
  campaignDescription: z.string().max(2000).optional().nullable(),
  contentType: z.enum(["sponsored", "ugc", "personal", "collab"]).optional().nullable(),
  platforms: z.array(z.string()).optional().nullable(),
  results: z.string().max(500).optional().nullable(),
  projectDate: z.string().optional().nullable(),
  featured: z.boolean().optional(),
});

// PATCH /api/portfolio-projects/[id] - Update project details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Check ownership
    const existing = await db.query.portfolioProjects.findFirst({
      where: and(
        eq(portfolioProjects.id, id),
        eq(portfolioProjects.userId, session.user.id)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = updateProjectSchema.parse(body);

    const [updated] = await db
      .update(portfolioProjects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(portfolioProjects.id, id))
      .returning();

    // Fetch complete project with media
    const completeProject = await db.query.portfolioProjects.findFirst({
      where: eq(portfolioProjects.id, updated.id),
      with: {
        projectMedia: {
          orderBy: [asc(portfolioProjectMedia.displayOrder)],
          with: {
            media: true,
          },
        },
      },
    });

    return NextResponse.json(completeProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating portfolio project:", error);
    return NextResponse.json(
      { error: "Failed to update portfolio project" },
      { status: 500 }
    );
  }
}

// DELETE /api/portfolio-projects/[id] - Delete a project (media stays)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Check ownership
    const existing = await db.query.portfolioProjects.findFirst({
      where: and(
        eq(portfolioProjects.id, id),
        eq(portfolioProjects.userId, session.user.id)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Delete project (cascade will delete project_media entries, but media stays)
    await db.delete(portfolioProjects).where(eq(portfolioProjects.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting portfolio project:", error);
    return NextResponse.json(
      { error: "Failed to delete portfolio project" },
      { status: 500 }
    );
  }
}

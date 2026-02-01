import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolioProjects, portfolioProjectMedia } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and, asc, desc } from "drizzle-orm";
import { z } from "zod";

const reorderProjectsSchema = z.object({
  projectIds: z.array(z.string().uuid()).min(1),
});

const reorderMediaSchema = z.object({
  projectId: z.string().uuid(),
  mediaIds: z.array(z.string().uuid()).min(1),
  coverId: z.string().uuid().optional(), // Optional: set new cover
});

// POST /api/portfolio-projects/reorder - Reorder projects or media within a project
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();

    // Check if this is a project reorder or media reorder
    if ("projectIds" in body) {
      // Reorder projects
      const data = reorderProjectsSchema.parse(body);

      // Verify all projects belong to the user
      const userProjects = await db
        .select({ id: portfolioProjects.id })
        .from(portfolioProjects)
        .where(eq(portfolioProjects.userId, session.user.id));

      const userProjectIds = new Set(userProjects.map((p) => p.id));
      const invalidIds = data.projectIds.filter((id) => !userProjectIds.has(id));

      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: "Some project IDs are invalid or not owned by user" },
          { status: 400 }
        );
      }

      // Update display order for each project
      await Promise.all(
        data.projectIds.map((projectId, index) =>
          db
            .update(portfolioProjects)
            .set({ displayOrder: index, updatedAt: new Date() })
            .where(eq(portfolioProjects.id, projectId))
        )
      );

      // Fetch updated projects
      const projects = await db.query.portfolioProjects.findMany({
        where: eq(portfolioProjects.userId, session.user.id),
        orderBy: [asc(portfolioProjects.displayOrder), desc(portfolioProjects.createdAt)],
        with: {
          projectMedia: {
            orderBy: [asc(portfolioProjectMedia.displayOrder)],
            with: {
              media: true,
            },
          },
        },
      });

      return NextResponse.json({ projects });
    } else if ("projectId" in body && "mediaIds" in body) {
      // Reorder media within a project
      const data = reorderMediaSchema.parse(body);

      // Verify project ownership
      const project = await db.query.portfolioProjects.findFirst({
        where: and(
          eq(portfolioProjects.id, data.projectId),
          eq(portfolioProjects.userId, session.user.id)
        ),
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      // Get current project media
      const currentMedia = await db
        .select({ mediaId: portfolioProjectMedia.mediaId })
        .from(portfolioProjectMedia)
        .where(eq(portfolioProjectMedia.projectId, data.projectId));

      const currentMediaIds = new Set(currentMedia.map((m) => m.mediaId));
      const invalidMediaIds = data.mediaIds.filter((id) => !currentMediaIds.has(id));

      if (invalidMediaIds.length > 0) {
        return NextResponse.json(
          { error: "Some media IDs are not attached to this project" },
          { status: 400 }
        );
      }

      // Update display order for each media
      await Promise.all(
        data.mediaIds.map((mediaId, index) =>
          db
            .update(portfolioProjectMedia)
            .set({ displayOrder: index })
            .where(
              and(
                eq(portfolioProjectMedia.projectId, data.projectId),
                eq(portfolioProjectMedia.mediaId, mediaId)
              )
            )
        )
      );

      // If cover specified, update it
      if (data.coverId && currentMediaIds.has(data.coverId)) {
        // Clear existing cover
        await db
          .update(portfolioProjectMedia)
          .set({ isCover: false })
          .where(eq(portfolioProjectMedia.projectId, data.projectId));

        // Set new cover
        await db
          .update(portfolioProjectMedia)
          .set({ isCover: true })
          .where(
            and(
              eq(portfolioProjectMedia.projectId, data.projectId),
              eq(portfolioProjectMedia.mediaId, data.coverId)
            )
          );
      }

      // Update project timestamp
      await db
        .update(portfolioProjects)
        .set({ updatedAt: new Date() })
        .where(eq(portfolioProjects.id, data.projectId));

      // Fetch updated project with media
      const updatedProject = await db.query.portfolioProjects.findFirst({
        where: eq(portfolioProjects.id, data.projectId),
        with: {
          projectMedia: {
            orderBy: [asc(portfolioProjectMedia.displayOrder)],
            with: {
              media: true,
            },
          },
        },
      });

      return NextResponse.json(updatedProject);
    } else {
      return NextResponse.json(
        { error: "Invalid request body. Provide either 'projectIds' or 'projectId' with 'mediaIds'" },
        { status: 400 }
      );
    }
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
    console.error("Error reordering:", error);
    return NextResponse.json(
      { error: "Failed to reorder" },
      { status: 500 }
    );
  }
}

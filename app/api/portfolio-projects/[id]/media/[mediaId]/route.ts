import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolioProjects, portfolioProjectMedia } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and, asc } from "drizzle-orm";

// DELETE /api/portfolio-projects/[id]/media/[mediaId] - Remove media from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: projectId, mediaId } = await params;

    // Check project ownership
    const project = await db.query.portfolioProjects.findFirst({
      where: and(
        eq(portfolioProjects.id, projectId),
        eq(portfolioProjects.userId, session.user.id)
      ),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if media is attached to project
    const projectMedia = await db.query.portfolioProjectMedia.findFirst({
      where: and(
        eq(portfolioProjectMedia.projectId, projectId),
        eq(portfolioProjectMedia.mediaId, mediaId)
      ),
    });

    if (!projectMedia) {
      return NextResponse.json(
        { error: "Media not found in project" },
        { status: 404 }
      );
    }

    const wasCover = projectMedia.isCover;

    // Delete the junction record (media itself stays)
    await db
      .delete(portfolioProjectMedia)
      .where(
        and(
          eq(portfolioProjectMedia.projectId, projectId),
          eq(portfolioProjectMedia.mediaId, mediaId)
        )
      );

    // If removed media was cover, set new cover to first remaining media
    if (wasCover) {
      const remainingMedia = await db
        .select({ id: portfolioProjectMedia.id })
        .from(portfolioProjectMedia)
        .where(eq(portfolioProjectMedia.projectId, projectId))
        .orderBy(asc(portfolioProjectMedia.displayOrder))
        .limit(1);

      if (remainingMedia.length > 0) {
        await db
          .update(portfolioProjectMedia)
          .set({ isCover: true })
          .where(eq(portfolioProjectMedia.id, remainingMedia[0].id));
      }
    }

    // Update project timestamp
    await db
      .update(portfolioProjects)
      .set({ updatedAt: new Date() })
      .where(eq(portfolioProjects.id, projectId));

    // Fetch updated project with media
    const updatedProject = await db.query.portfolioProjects.findFirst({
      where: eq(portfolioProjects.id, projectId),
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
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error removing media from project:", error);
    return NextResponse.json(
      { error: "Failed to remove media from project" },
      { status: 500 }
    );
  }
}

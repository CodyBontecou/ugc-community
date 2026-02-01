import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolioProjects, portfolioProjectMedia, media } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and, sql, asc } from "drizzle-orm";
import { z } from "zod";

const addMediaSchema = z.object({
  mediaIds: z.array(z.string().uuid()).min(1),
  isCover: z.string().uuid().optional(), // Optional: specify which media should be cover
});

// POST /api/portfolio-projects/[id]/media - Add media to project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: projectId } = await params;

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

    const body = await request.json();
    const data = addMediaSchema.parse(body);

    // Verify all media belongs to the user
    const userMedia = await db
      .select({ id: media.id })
      .from(media)
      .where(
        and(
          eq(media.userId, session.user.id),
          sql`${media.id} IN ${data.mediaIds}`
        )
      );

    const validMediaIds = new Set(userMedia.map((m) => m.id));
    const mediaToAttach = data.mediaIds.filter((id) => validMediaIds.has(id));

    if (mediaToAttach.length === 0) {
      return NextResponse.json(
        { error: "No valid media IDs provided" },
        { status: 400 }
      );
    }

    // Get current max display order for this project
    const [maxOrder] = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(display_order), -1)` })
      .from(portfolioProjectMedia)
      .where(eq(portfolioProjectMedia.projectId, projectId));

    // Check which media is already attached
    const existingMedia = await db
      .select({ mediaId: portfolioProjectMedia.mediaId })
      .from(portfolioProjectMedia)
      .where(eq(portfolioProjectMedia.projectId, projectId));

    const existingMediaIds = new Set(existingMedia.map((m) => m.mediaId));
    const newMediaIds = mediaToAttach.filter((id) => !existingMediaIds.has(id));

    if (newMediaIds.length === 0) {
      return NextResponse.json(
        { error: "All media is already attached to this project" },
        { status: 400 }
      );
    }

    // Check if project has any media (to determine if first one should be cover)
    const hasExistingMedia = existingMedia.length > 0;

    // Insert new media
    let currentOrder = (maxOrder?.maxOrder ?? -1) + 1;
    await db.insert(portfolioProjectMedia).values(
      newMediaIds.map((mediaId, index) => ({
        projectId,
        mediaId,
        displayOrder: currentOrder + index,
        isCover: !hasExistingMedia && index === 0, // First media is cover if no existing
      }))
    );

    // If a specific cover was requested, update it
    if (data.isCover && validMediaIds.has(data.isCover)) {
      // Clear existing cover
      await db
        .update(portfolioProjectMedia)
        .set({ isCover: false })
        .where(eq(portfolioProjectMedia.projectId, projectId));

      // Set new cover
      await db
        .update(portfolioProjectMedia)
        .set({ isCover: true })
        .where(
          and(
            eq(portfolioProjectMedia.projectId, projectId),
            eq(portfolioProjectMedia.mediaId, data.isCover)
          )
        );
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error adding media to project:", error);
    return NextResponse.json(
      { error: "Failed to add media to project" },
      { status: 500 }
    );
  }
}

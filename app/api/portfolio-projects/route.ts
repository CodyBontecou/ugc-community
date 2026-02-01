import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolioProjects, portfolioProjectMedia, media } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import { z } from "zod";

// GET /api/portfolio-projects - List user's projects with media
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(request.url);
    const includeFeaturedOnly = searchParams.get("featured") === "true";

    const conditions = [eq(portfolioProjects.userId, session.user.id)];
    if (includeFeaturedOnly) {
      conditions.push(eq(portfolioProjects.featured, true));
    }

    const projects = await db.query.portfolioProjects.findMany({
      where: and(...conditions),
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
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing portfolio projects:", error);
    return NextResponse.json(
      { error: "Failed to list portfolio projects" },
      { status: 500 }
    );
  }
}

const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  brandName: z.string().max(200).optional().nullable(),
  campaignDescription: z.string().max(2000).optional().nullable(),
  contentType: z.enum(["sponsored", "ugc", "personal", "collab"]).optional().nullable(),
  platforms: z.array(z.string()).optional().nullable(),
  results: z.string().max(500).optional().nullable(),
  projectDate: z.string().optional().nullable(), // ISO date string
  featured: z.boolean().optional(),
  mediaIds: z.array(z.string().uuid()).optional(), // Optional: attach media on creation
});

// POST /api/portfolio-projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const data = createProjectSchema.parse(body);

    // Get the max display order for this user's projects
    const [maxOrder] = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(display_order), -1)` })
      .from(portfolioProjects)
      .where(eq(portfolioProjects.userId, session.user.id));

    const [project] = await db
      .insert(portfolioProjects)
      .values({
        userId: session.user.id,
        title: data.title,
        brandName: data.brandName,
        campaignDescription: data.campaignDescription,
        contentType: data.contentType,
        platforms: data.platforms,
        results: data.results,
        projectDate: data.projectDate,
        featured: data.featured ?? false,
        displayOrder: (maxOrder?.maxOrder ?? -1) + 1,
      })
      .returning();

    // If mediaIds provided, attach them to the project
    if (data.mediaIds && data.mediaIds.length > 0) {
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

      if (mediaToAttach.length > 0) {
        await db.insert(portfolioProjectMedia).values(
          mediaToAttach.map((mediaId, index) => ({
            projectId: project.id,
            mediaId,
            displayOrder: index,
            isCover: index === 0, // First media is cover by default
          }))
        );
      }
    }

    // Fetch the complete project with media
    const completeProject = await db.query.portfolioProjects.findFirst({
      where: eq(portfolioProjects.id, project.id),
      with: {
        projectMedia: {
          orderBy: [asc(portfolioProjectMedia.displayOrder)],
          with: {
            media: true,
          },
        },
      },
    });

    return NextResponse.json(completeProject, { status: 201 });
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
    console.error("Error creating portfolio project:", error);
    return NextResponse.json(
      { error: "Failed to create portfolio project" },
      { status: 500 }
    );
  }
}

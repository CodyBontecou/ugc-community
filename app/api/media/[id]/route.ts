import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { deleteFromBlob } from "@/lib/storage/blob-client";
import { z } from "zod";

// GET /api/media/[id] - Get a single media item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const mediaItem = await db.query.media.findFirst({
      where: and(eq(media.id, id), eq(media.userId, session.user.id)),
    });

    if (!mediaItem) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json(mediaItem);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

const updateMediaSchema = z.object({
  metadata: z
    .object({
      alt: z.string().optional(),
      caption: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
});

// PATCH /api/media/[id] - Update media metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Check ownership
    const existing = await db.query.media.findFirst({
      where: and(eq(media.id, id), eq(media.userId, session.user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const body = await request.json();
    const { metadata } = updateMediaSchema.parse(body);

    if (metadata) {
      // Merge new metadata with existing
      const updatedMetadata = {
        ...existing.metadata,
        ...metadata,
      };

      const [updated] = await db
        .update(media)
        .set({
          metadata: updatedMetadata,
          updatedAt: new Date(),
        })
        .where(eq(media.id, id))
        .returning();

      return NextResponse.json(updated);
    }

    return NextResponse.json(existing);
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
    console.error("Error updating media:", error);
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}

// DELETE /api/media/[id] - Delete a media item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Check ownership and get the item
    const existing = await db.query.media.findFirst({
      where: and(eq(media.id, id), eq(media.userId, session.user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Delete from Vercel Blob
    try {
      await deleteFromBlob(existing.url);
    } catch (blobError) {
      console.error("Failed to delete from Vercel Blob:", blobError);
      // Continue with database deletion even if Blob delete fails
    }

    // Delete from database
    await db.delete(media).where(eq(media.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}

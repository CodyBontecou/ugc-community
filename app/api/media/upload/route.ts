import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import {
  generatePathname,
  validateFile,
  getMediaType,
  uploadToBlob,
} from "@/lib/storage/blob-client";

// POST /api/media/upload - Upload a file
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file.type, file.size);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate pathname and upload
    const pathname = generatePathname(session.user.id, file.name, file.type);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const blob = await uploadToBlob(pathname, buffer, file.type);
    const mediaType = getMediaType(file.type);

    // Insert into database
    const [mediaRecord] = await db
      .insert(media)
      .values({
        userId: session.user.id,
        type: mediaType,
        filename: blob.pathname,
        originalFilename: file.name,
        mimeType: file.type,
        size: file.size,
        url: blob.url,
        metadata: {},
      })
      .returning();

    return NextResponse.json(mediaRecord, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error uploading media:", error);
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 }
    );
  }
}

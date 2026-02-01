import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import {
  generatePathname,
  validateFile,
  getMediaType,
  uploadToBlob,
  generateThumbnailPathname,
  ALLOWED_IMAGE_TYPES,
} from "@/lib/storage/blob-client";
import sharp from "sharp";

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

    let thumbnailUrl: string | null = null;
    let imageMetadata: { width?: number; height?: number } = {};

    // For images: generate thumbnail and extract metadata
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      try {
        const sharpImage = sharp(buffer);
        const metadata = await sharpImage.metadata();

        // Extract dimensions
        if (metadata.width && metadata.height) {
          imageMetadata = {
            width: metadata.width,
            height: metadata.height,
          };
        }

        // Generate thumbnail (max 400px width, preserve aspect ratio)
        const thumbnailBuffer = await sharpImage
          .resize(400, null, { withoutEnlargement: true })
          .toBuffer();

        const thumbnailPathname = generateThumbnailPathname(pathname);
        const thumbnailBlob = await uploadToBlob(
          thumbnailPathname,
          thumbnailBuffer,
          file.type
        );
        thumbnailUrl = thumbnailBlob.url;
      } catch (err) {
        // Log error but don't fail the upload - thumbnail is optional
        console.error("Error generating thumbnail/metadata:", err);
      }
    }

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
        thumbnailUrl,
        metadata: imageMetadata,
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

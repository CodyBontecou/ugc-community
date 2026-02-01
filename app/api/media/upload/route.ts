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
  ALLOWED_VIDEO_TYPES,
  shouldConvertToWebP,
} from "@/lib/storage/blob-client";
import { inngest } from "@/lib/inngest/client";
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

    const arrayBuffer = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer);
    const mediaType = getMediaType(file.type);
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    // For images that should be converted to WebP, do the conversion
    let finalMimeType = file.type;
    let pathname: string;

    if (isImage && shouldConvertToWebP(file.type)) {
      // Process image: auto-orient, resize large images, strip EXIF, convert to WebP
      buffer = Buffer.from(
        await sharp(buffer)
          .rotate() // Auto-orient based on EXIF, then EXIF is stripped
          .resize(2000, 2000, { fit: "inside", withoutEnlargement: true }) // Max 2000px, preserve aspect ratio
          .webp({ quality: 80 })
          .toBuffer()
      );
      finalMimeType = "image/webp";
      pathname = generatePathname(session.user.id, file.name, file.type, "webp");
    } else {
      pathname = generatePathname(session.user.id, file.name, file.type);
    }

    const blob = await uploadToBlob(pathname, buffer, finalMimeType);

    let thumbnailUrl: string | null = null;
    let imageMetadata: { width?: number; height?: number } = {};

    // For images: generate thumbnail and extract metadata
    if (isImage) {
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

        // Generate thumbnail (max 400px width, preserve aspect ratio, always WebP)
        const thumbnailBuffer = await sharpImage
          .resize(400, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const thumbnailPathname = generateThumbnailPathname(pathname).replace(/\.\w+$/, ".webp");
        const thumbnailBlob = await uploadToBlob(
          thumbnailPathname,
          thumbnailBuffer,
          "image/webp"
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
        mimeType: finalMimeType,
        size: buffer.length, // Use converted buffer size
        url: blob.url,
        thumbnailUrl,
        metadata: imageMetadata,
      })
      .returning();

    // For videos: trigger async processing for poster frame and duration
    if (isVideo) {
      await inngest.send({
        name: "media/video.uploaded",
        data: {
          mediaId: mediaRecord.id,
          userId: session.user.id,
          videoUrl: blob.url,
        },
      });
    }

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

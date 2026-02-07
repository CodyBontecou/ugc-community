import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { getJobById } from "@/lib/jobs/queries";
import {
  validateFile,
  generatePathname,
  uploadToBlob,
  ALLOWED_IMAGE_TYPES,
  shouldConvertToWebP,
} from "@/lib/storage/blob-client";
import sharp from "sharp";

// POST /api/admin/jobs/[jobId]/hooks/screenshot-upload - Upload a screenshot image
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { jobId } = await params;
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Only allow image types
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const validation = validateFile(file.type, file.size);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    let finalMimeType = file.type;
    let pathname: string;

    // Convert to WebP if applicable, resize large images
    if (shouldConvertToWebP(file.type)) {
      buffer = Buffer.from(
        await sharp(buffer)
          .rotate()
          .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer()
      );
      finalMimeType = "image/webp";
      pathname = generatePathname(
        `hooks/${jobId}`,
        file.name,
        file.type,
        "webp"
      );
    } else {
      pathname = generatePathname(`hooks/${jobId}`, file.name, file.type);
    }

    const blob = await uploadToBlob(pathname, buffer, finalMimeType);

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error uploading hook screenshot:", error);
    return NextResponse.json(
      { error: "Failed to upload screenshot" },
      { status: 500 }
    );
  }
}

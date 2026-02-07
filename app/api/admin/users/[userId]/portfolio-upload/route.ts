/**
 * Portfolio Upload API — Admin drag-and-drop upload
 *
 * POST /api/admin/users/[userId]/portfolio-upload
 *
 * Accepts a multipart form upload of portfolio files (HTML, CSS, JS, images, etc.)
 * and deploys them to Vercel Blob under `portfolios/{subdomain}/`.
 *
 * Optionally accepts a single .zip file which is extracted automatically.
 *
 * Requires admin auth and that the user has a subdomain configured.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import {
  PortfolioUploadError,
  uploadPortfolioForUser,
  type UploadInputFile,
} from "@/lib/portfolio/admin-upload";

// Allow up to 60s for portfolio upload (cold start + delete old files + upload new ones to Vercel Blob)
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const t0 = Date.now();
  try {
    // 1. Auth check
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await params;
    console.log(`[portfolio-upload] userId=${userId} started (+${Date.now() - t0}ms)`);

    // 2. Parse multipart form data
    const formData = await request.formData();
    const rawFiles = formData.getAll("files");
    const files = rawFiles.filter(
      (value): value is File => value instanceof File
    );
    const replaceExisting = formData.get("replace") === "true";

    console.log(
      `[portfolio-upload] parsed ${files.length} files, replace=${replaceExisting} (+${Date.now() - t0}ms)`
    );

    const uploadFiles: UploadInputFile[] = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        return {
          name: file.name,
          size: file.size,
          data: Buffer.from(arrayBuffer),
        };
      })
    );

    // 3. Execute shared upload pipeline (same behavior used by CLI skill)
    const result = await uploadPortfolioForUser({
      userId,
      files: uploadFiles,
      replaceExisting,
    });

    console.log(
      `[portfolio-upload] success: ${result.filesUploaded} files uploaded, ${result.filesDeleted} deleted (+${Date.now() - t0}ms)`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      `[portfolio-upload] error after ${Date.now() - t0}ms:`,
      error
    );

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof PortfolioUploadError) {
      return NextResponse.json(error.toResponseBody(), {
        status: error.status,
      });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload portfolio",
      },
      { status: 500 }
    );
  }
}

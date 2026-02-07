import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { getJobById } from "@/lib/jobs/queries";
import { listJobHooks, createJobHook } from "@/lib/jobs/hook-queries";

// GET /api/admin/jobs/[jobId]/hooks - List hooks for a job
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { jobId } = await params;
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const hooks = await listJobHooks(jobId);
    return NextResponse.json({ hooks });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing job hooks:", error);
    return NextResponse.json({ error: "Failed to list hooks" }, { status: 500 });
  }
}

// POST /api/admin/jobs/[jobId]/hooks - Create a hook
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { jobId } = await params;
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const body = await request.json();
    if (!body.hookText?.trim()) {
      return NextResponse.json({ error: "hookText is required" }, { status: 400 });
    }

    const hook = await createJobHook({
      jobId,
      hookText: body.hookText.trim(),
      screenshotUrl: body.screenshotUrl?.trim() || null,
      sortOrder: body.sortOrder,
    });

    return NextResponse.json({ hook }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating job hook:", error);
    return NextResponse.json({ error: "Failed to create hook" }, { status: 500 });
  }
}

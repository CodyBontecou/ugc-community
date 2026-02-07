import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { getJobHook, updateJobHook, deleteJobHook } from "@/lib/jobs/hook-queries";

// PATCH /api/admin/jobs/[jobId]/hooks/[hookId] - Update a hook
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; hookId: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { jobId, hookId } = await params;

    const existing = await getJobHook(hookId);
    if (!existing || existing.jobId !== jobId) {
      return NextResponse.json({ error: "Hook not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Parameters<typeof updateJobHook>[1] = {};

    if (body.hookText !== undefined) {
      if (!body.hookText?.trim()) {
        return NextResponse.json({ error: "hookText cannot be empty" }, { status: 400 });
      }
      updates.hookText = body.hookText.trim();
    }
    if (body.screenshotUrl !== undefined) {
      updates.screenshotUrl = body.screenshotUrl?.trim() || null;
    }
    if (body.sortOrder !== undefined) {
      updates.sortOrder = body.sortOrder;
    }

    const hook = await updateJobHook(hookId, updates);
    return NextResponse.json({ hook });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating job hook:", error);
    return NextResponse.json({ error: "Failed to update hook" }, { status: 500 });
  }
}

// DELETE /api/admin/jobs/[jobId]/hooks/[hookId] - Delete a hook
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string; hookId: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { jobId, hookId } = await params;

    const existing = await getJobHook(hookId);
    if (!existing || existing.jobId !== jobId) {
      return NextResponse.json({ error: "Hook not found" }, { status: 404 });
    }

    await deleteJobHook(hookId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting job hook:", error);
    return NextResponse.json({ error: "Failed to delete hook" }, { status: 500 });
  }
}

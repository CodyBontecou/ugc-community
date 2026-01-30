import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { listJobs, createJob } from "@/lib/jobs/queries";
import type { JobStatus } from "@/lib/jobs/constants";

// GET /api/admin/jobs - List all jobs for admin
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as JobStatus | undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await listJobs({
      filters: status ? { status } : undefined,
      limit,
      offset,
      includeApplicationCount: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing jobs:", error);
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}

// POST /api/admin/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.description || !body.compensationType) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, compensationType" },
        { status: 400 }
      );
    }

    const job = await createJob({
      title: body.title,
      description: body.description,
      hooks: body.hooks || [],
      compensationType: body.compensationType,
      compensationDetails: body.compensationDetails,
      niches: body.niches || [],
      platforms: body.platforms || [],
      status: body.status || "draft",
      createdBy: session.user.id,
      brandId: body.brandId || null, // NULL for ugc.community jobs
      isFeatured: body.isFeatured || false,
      deadlineAt: body.deadlineAt ? new Date(body.deadlineAt) : undefined,
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating job:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}

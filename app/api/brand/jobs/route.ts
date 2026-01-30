import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { listBrandJobs, createJob, countBrandActiveJobs } from "@/lib/jobs/queries";
import { BRAND_MAX_ACTIVE_JOBS, type JobStatus } from "@/lib/jobs/constants";

// GET /api/brand/jobs - List brand's own jobs
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.user.role !== "brand") {
      return NextResponse.json({ error: "Brand access required" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as JobStatus | undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await listBrandJobs(session.user.id, {
      status,
      limit,
      offset,
    });

    // Include the brand's job limit info
    const activeJobCount = await countBrandActiveJobs(session.user.id);

    return NextResponse.json({
      ...result,
      limits: {
        used: activeJobCount,
        max: BRAND_MAX_ACTIVE_JOBS,
        remaining: Math.max(0, BRAND_MAX_ACTIVE_JOBS - activeJobCount),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing brand jobs:", error);
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}

// POST /api/brand/jobs - Create a new job (status: draft or pending_review)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.user.role !== "brand") {
      return NextResponse.json({ error: "Brand access required" }, { status: 403 });
    }

    // Check job limit
    const activeJobCount = await countBrandActiveJobs(session.user.id);
    if (activeJobCount >= BRAND_MAX_ACTIVE_JOBS) {
      return NextResponse.json(
        {
          error: `Job limit reached. You can have up to ${BRAND_MAX_ACTIVE_JOBS} active, pending, or draft jobs.`,
          limits: {
            used: activeJobCount,
            max: BRAND_MAX_ACTIVE_JOBS,
            remaining: 0,
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.description || !body.compensationType) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, compensationType" },
        { status: 400 }
      );
    }

    // Brands can only set status to draft or pending_review
    const allowedStatuses = ["draft", "pending_review"];
    const status = body.status && allowedStatuses.includes(body.status) ? body.status : "draft";

    const job = await createJob({
      title: body.title,
      description: body.description,
      hooks: body.hooks || [],
      compensationType: body.compensationType,
      compensationDetails: body.compensationDetails,
      niches: body.niches || [],
      platforms: body.platforms || [],
      status,
      createdBy: session.user.id,
      brandId: session.user.id, // Brand is both creator and owner
      isFeatured: false, // Brands cannot set featured
      deadlineAt: body.deadlineAt ? new Date(body.deadlineAt) : undefined,
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating brand job:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}

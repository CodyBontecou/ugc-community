import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { listJobs } from "@/lib/jobs/queries";
import type { JobStatus, CompensationType, Platform } from "@/lib/jobs/constants";

// GET /api/jobs - List active jobs for creators
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const niches = searchParams.get("niches")?.split(",").filter(Boolean);
    const platforms = searchParams.get("platforms")?.split(",").filter(Boolean) as Platform[] | undefined;
    const compensationType = searchParams.get("compensationType") as CompensationType | undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await listJobs({
      filters: {
        status: "active" as JobStatus, // Creators only see active jobs
        niches,
        platforms,
        compensationType,
        search,
      },
      limit,
      offset,
      creatorId: session.user.id, // Include application status
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing jobs:", error);
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}

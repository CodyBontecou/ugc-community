import { NextRequest, NextResponse } from "next/server";
import { getDirectoryCreators } from "@/lib/directory/queries";
import { getServerSession } from "@/lib/auth/session";
import {
  NICHES,
  RATE_RANGES,
  SORT_OPTIONS,
  DEFAULT_PAGE_SIZE,
  type Niche,
  type RateRange,
  type SortOption,
} from "@/lib/directory/constants";

// GET /api/directory/creators - List creators with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Check if user is authenticated
    const session = await getServerSession();
    const isAuthenticated = !!session?.user;

    // Parse filters
    const nichesParam = searchParams.get("niches");
    const niches = nichesParam
      ? (nichesParam.split(",").filter((n) => NICHES.includes(n as Niche)) as Niche[])
      : undefined;

    const location = searchParams.get("location") || undefined;

    const rateRangeParam = searchParams.get("rateRange");
    const rateRange =
      rateRangeParam && RATE_RANGES.includes(rateRangeParam as RateRange)
        ? (rateRangeParam as RateRange)
        : undefined;

    const availableParam = searchParams.get("available");
    const availableForHire =
      availableParam === "true"
        ? true
        : availableParam === "false"
          ? false
          : undefined;

    // Parse sort
    const sortParam = searchParams.get("sort");
    const sort =
      sortParam &&
      SORT_OPTIONS.some((o) => o.value === sortParam)
        ? (sortParam as SortOption)
        : "popular";

    // Parse pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10))
    );

    const { creators, total } = await getDirectoryCreators(
      { niches, location, rateRange, availableForHire, showAll: isAuthenticated },
      { sort },
      { page, pageSize }
    );

    return NextResponse.json({
      creators,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching directory creators:", error);
    return NextResponse.json(
      { error: "Failed to fetch creators" },
      { status: 500 }
    );
  }
}

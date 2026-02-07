import { NextRequest, NextResponse } from "next/server";
import {
  getDirectoryCreators,
  type DirectoryFilters,
  type DirectorySort,
  type DirectoryPagination,
} from "@/lib/directory/queries";
import type { Niche, RateRange, SortOption } from "@/lib/directory/constants";
import { NICHES, RATE_RANGES, SORT_OPTIONS } from "@/lib/directory/constants";

// GET /api/directory - Public directory listing (only creators with live portfolios)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filters
    const filters: DirectoryFilters = {};

    const nichesParam = searchParams.get("niches");
    if (nichesParam) {
      const niches = nichesParam.split(",").filter((n) => (NICHES as readonly string[]).includes(n));
      if (niches.length > 0) {
        filters.niches = niches as Niche[];
      }
    }

    const location = searchParams.get("location");
    if (location) {
      filters.location = location;
    }

    const rateRange = searchParams.get("rateRange");
    if (rateRange && (RATE_RANGES as readonly string[]).includes(rateRange)) {
      filters.rateRange = rateRange as RateRange;
    }

    const availableForHire = searchParams.get("availableForHire");
    if (availableForHire === "true") {
      filters.availableForHire = true;
    }

    // Parse sort
    const sort: DirectorySort = {};
    const sortParam = searchParams.get("sort");
    const validSorts = SORT_OPTIONS.map((s) => s.value);
    if (sortParam && validSorts.includes(sortParam as SortOption)) {
      sort.sort = sortParam as SortOption;
    }

    // Parse pagination
    const pagination: DirectoryPagination = {};
    const page = searchParams.get("page");
    if (page) {
      pagination.page = Math.max(1, parseInt(page, 10) || 1);
    }
    const pageSize = searchParams.get("pageSize");
    if (pageSize) {
      pagination.pageSize = Math.min(48, Math.max(1, parseInt(pageSize, 10) || 24));
    }

    const result = await getDirectoryCreators(filters, sort, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching directory:", error);
    return NextResponse.json(
      { error: "Failed to fetch directory" },
      { status: 500 }
    );
  }
}

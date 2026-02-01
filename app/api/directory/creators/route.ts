import { NextRequest, NextResponse } from "next/server";
import { getDirectoryCreators } from "@/lib/directory/queries";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessCreatorDirectory } from "@/lib/roles";
import { isAdmin } from "@/lib/admin";
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
// Restricted to Brand and Admin users only
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Check if user is authenticated
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin or brand
    const isUserAdmin = isAdmin(session.user.email);
    if (!isUserAdmin) {
      // Fetch user role from database
      const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

      const userRole = user[0]?.role;
      if (!canAccessCreatorDirectory(userRole)) {
        return NextResponse.json(
          { error: "Access denied. Only brand accounts can browse the creator directory." },
          { status: 403 }
        );
      }
    }

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
      { niches, location, rateRange, availableForHire, showAll: true },
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

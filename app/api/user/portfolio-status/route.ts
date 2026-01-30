import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getPortfolioStatus } from "@/lib/portfolio/status";

export type PortfolioStatusResponse = {
  isActive: boolean;
  reason: "hosting_reward" | "posting_requirement_met" | "requirement_not_met";
  hasHostingReward: boolean;
  hostingRewardExpiry: string | null;
  monthlyPostCount: number;
  requiredPostCount: number;
};

/**
 * GET /api/user/portfolio-status - Get current user's portfolio status
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const status = await getPortfolioStatus(userId);

    const response: PortfolioStatusResponse = {
      isActive: status.isActive,
      reason: status.reason,
      hasHostingReward: status.hasHostingReward,
      hostingRewardExpiry: status.hostingRewardExpiry?.toISOString() ?? null,
      monthlyPostCount: status.monthlyPostCount,
      requiredPostCount: status.requiredPostCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching portfolio status:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio status" },
      { status: 500 }
    );
  }
}

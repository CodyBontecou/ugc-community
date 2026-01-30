import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getUserActiveRewards } from "@/lib/milestones";

export type ActiveRewardResponse = {
  type: string;
  name: string;
  description: string;
  earnedAt: string;
  expiresAt: string | null;
  isPermanent: boolean;
  milestoneName: string;
  daysRemaining: number | null;
};

/**
 * GET /api/user/rewards - Get current user's active rewards
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const activeRewards = await getUserActiveRewards(userId);
    const now = new Date();

    // Convert to response format with computed fields
    const rewards: ActiveRewardResponse[] = activeRewards.map((reward) => {
      let daysRemaining: number | null = null;
      if (reward.expiresAt) {
        const diffMs = reward.expiresAt.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }

      return {
        type: reward.type,
        name: reward.name,
        description: reward.description,
        earnedAt: reward.earnedAt.toISOString(),
        expiresAt: reward.expiresAt?.toISOString() ?? null,
        isPermanent: reward.isPermanent,
        milestoneName: reward.milestoneName,
        daysRemaining,
      };
    });

    return NextResponse.json({ rewards });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching user rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch rewards" },
      { status: 500 }
    );
  }
}

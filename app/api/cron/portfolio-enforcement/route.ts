import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, hashtagMentions } from "@/lib/db/schema";
import { eq, and, gte, sql, isNotNull } from "drizzle-orm";
import {
  sendPortfolioDisabledEmail,
  sendPortfolioReenabledEmail,
} from "@/lib/email";

const MONTHLY_POST_REQUIREMENT = 5;

/**
 * Grace period: don't disable sites during the first 7 days of a new month.
 * This gives creators time to start posting before enforcement kicks in.
 * During the grace period, we also accept last month's posts as valid.
 */
const GRACE_PERIOD_DAYS = 7;

type CreatorRow = {
  id: string;
  name: string;
  email: string;
  subdomain: string;
  siteEnabled: boolean;
  hostingUnlockedUntil: Date | null;
};

type EnforcementAction = {
  userId: string;
  name: string;
  subdomain: string;
  action: "disabled" | "enabled";
  reason: string;
};

type EnforcementError = {
  userId: string;
  subdomain: string;
  action: string;
  error: string;
};

/**
 * GET /api/cron/portfolio-enforcement
 *
 * Daily cron that enforces the 5-posts-per-month portfolio requirement.
 *
 * - Disables sites for creators who haven't met posting requirements
 * - Re-enables sites for creators who have met requirements
 * - Respects hosting rewards (milestone bypass)
 * - 7-day grace period at start of each month
 *
 * Schedule: Runs daily at 4 AM UTC
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayOfMonth = now.getUTCDate();
  const inGracePeriod = dayOfMonth <= GRACE_PERIOD_DAYS;

  console.log(
    `[PortfolioEnforcement] Started. Day ${dayOfMonth}, grace period: ${inGracePeriod}`
  );

  try {
    // Fetch all creators that have a portfolio set up (have a subdomain)
    const creators = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        subdomain: users.subdomain,
        siteEnabled: users.siteEnabled,
        hostingUnlockedUntil: users.hostingUnlockedUntil,
      })
      .from(users)
      .where(isNotNull(users.subdomain));

    console.log(
      `[PortfolioEnforcement] Found ${creators.length} creators with portfolios`
    );

    // Get current month post counts for all creators in one query
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );
    const currentMonthCounts = await getPostCounts(startOfMonth);

    // During grace period, also get previous month counts
    let previousMonthCounts: Map<string, number> = new Map();
    if (inGracePeriod) {
      const startOfPreviousMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
      );
      previousMonthCounts = await getPostCounts(
        startOfPreviousMonth,
        startOfMonth
      );
    }

    const actions: EnforcementAction[] = [];
    const errors: EnforcementError[] = [];

    for (const creator of creators as CreatorRow[]) {
      if (!creator.subdomain) continue;

      try {
        const result = await enforceCreator(
          creator,
          currentMonthCounts,
          previousMonthCounts,
          inGracePeriod,
          now
        );
        if (result) {
          actions.push(result);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        console.error(
          `[PortfolioEnforcement] Error for ${creator.subdomain}: ${message}`
        );
        errors.push({
          userId: creator.id,
          subdomain: creator.subdomain,
          action: "enforce",
          error: message,
        });
      }
    }

    // Log summary
    const disabled = actions.filter((a) => a.action === "disabled").length;
    const enabled = actions.filter((a) => a.action === "enabled").length;
    console.log(
      `[PortfolioEnforcement] Complete. Disabled: ${disabled}, Re-enabled: ${enabled}, Errors: ${errors.length}`
    );

    return NextResponse.json({
      success: errors.length === 0,
      summary: {
        totalCreators: creators.length,
        disabled,
        enabled,
        unchanged: creators.length - disabled - enabled,
        errors: errors.length,
        gracePeriod: inGracePeriod,
        dayOfMonth,
      },
      actions: actions.length > 0 ? actions : undefined,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[PortfolioEnforcement] Fatal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get post counts per user for a given time range.
 * If `endDate` is not provided, counts from `startDate` to now.
 */
async function getPostCounts(
  startDate: Date,
  endDate?: Date
): Promise<Map<string, number>> {
  const conditions = [gte(hashtagMentions.postedAt, startDate)];

  if (endDate) {
    const { lt } = await import("drizzle-orm");
    conditions.push(lt(hashtagMentions.postedAt, endDate));
  }

  const rows = await db
    .select({
      userId: hashtagMentions.matchedUserId,
      count: sql<number>`count(*)`,
    })
    .from(hashtagMentions)
    .where(and(isNotNull(hashtagMentions.matchedUserId), ...conditions))
    .groupBy(hashtagMentions.matchedUserId);

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.userId) {
      counts.set(row.userId, Number(row.count));
    }
  }
  return counts;
}

/**
 * Determine if a creator's portfolio should be active and take action if needed.
 * Returns an action object if a change was made, or null if no change.
 */
async function enforceCreator(
  creator: CreatorRow,
  currentMonthCounts: Map<string, number>,
  previousMonthCounts: Map<string, number>,
  inGracePeriod: boolean,
  now: Date
): Promise<EnforcementAction | null> {
  // Check hosting reward (bypass posting requirement)
  const hasHostingReward =
    creator.hostingUnlockedUntil !== null &&
    creator.hostingUnlockedUntil > now;

  const currentPosts = currentMonthCounts.get(creator.id) ?? 0;
  const previousPosts = previousMonthCounts.get(creator.id) ?? 0;

  // Determine if portfolio should be active
  let shouldBeActive: boolean;
  let reason: string;

  if (hasHostingReward) {
    shouldBeActive = true;
    reason = `Hosting reward active until ${creator.hostingUnlockedUntil!.toISOString().split("T")[0]}`;
  } else if (currentPosts >= MONTHLY_POST_REQUIREMENT) {
    shouldBeActive = true;
    reason = `Current month: ${currentPosts}/${MONTHLY_POST_REQUIREMENT} posts`;
  } else if (
    inGracePeriod &&
    previousPosts >= MONTHLY_POST_REQUIREMENT
  ) {
    // During grace period, accept previous month's posts
    shouldBeActive = true;
    reason = `Grace period: previous month ${previousPosts}/${MONTHLY_POST_REQUIREMENT} posts (current: ${currentPosts})`;
  } else {
    shouldBeActive = false;
    reason = `Current month: ${currentPosts}/${MONTHLY_POST_REQUIREMENT} posts${inGracePeriod ? `, previous month: ${previousPosts}/${MONTHLY_POST_REQUIREMENT}` : ""}`;
  }

  // Compare desired state with actual state
  if (shouldBeActive && !creator.siteEnabled) {
    // Re-enable the site
    console.log(
      `[PortfolioEnforcement] Re-enabling ${creator.subdomain}: ${reason}`
    );

    await db
      .update(users)
      .set({ siteEnabled: true, updatedAt: new Date() })
      .where(eq(users.id, creator.id));

    // Send re-enabled notification
    try {
      await sendPortfolioReenabledEmail({
        creatorName: creator.name,
        creatorEmail: creator.email,
        subdomain: creator.subdomain,
      });
    } catch (emailErr) {
      console.error(
        `[PortfolioEnforcement] Failed to send re-enabled email to ${creator.email}:`,
        emailErr
      );
    }

    return {
      userId: creator.id,
      name: creator.name,
      subdomain: creator.subdomain,
      action: "enabled",
      reason,
    };
  }

  if (!shouldBeActive && creator.siteEnabled) {
    // Disable the site
    console.log(
      `[PortfolioEnforcement] Disabling ${creator.subdomain}: ${reason}`
    );

    await db
      .update(users)
      .set({ siteEnabled: false, updatedAt: new Date() })
      .where(eq(users.id, creator.id));

    // Send disabled notification
    try {
      await sendPortfolioDisabledEmail({
        creatorName: creator.name,
        creatorEmail: creator.email,
        subdomain: creator.subdomain,
        currentPostCount: currentPosts,
        requiredPostCount: MONTHLY_POST_REQUIREMENT,
      });
    } catch (emailErr) {
      console.error(
        `[PortfolioEnforcement] Failed to send disabled email to ${creator.email}:`,
        emailErr
      );
    }

    return {
      userId: creator.id,
      name: creator.name,
      subdomain: creator.subdomain,
      action: "disabled",
      reason,
    };
  }

  // No change needed
  return null;
}

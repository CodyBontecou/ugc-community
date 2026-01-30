/**
 * Edit Allowance Service
 *
 * Manages user profile edit allowances granted by milestones.
 */

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export type EditAllowanceStatus = {
  canEdit: boolean;
  editsRemaining: number | "unlimited";
  editsUsed: number;
  editsAllowance: number;
  hasUnlimitedEdits: boolean;
  unlimitedEditsUntil: Date | null;
  currentMonth: string;
};

/**
 * Get the current edit allowance for a user
 */
export async function getUserEditAllowance(
  userId: string
): Promise<EditAllowanceStatus> {
  const currentMonth = new Date().toISOString().slice(0, 7); // '2026-01' format
  const now = new Date();

  const [user] = await db
    .select({
      monthlyEditsUsed: users.monthlyEditsUsed,
      monthlyEditsAllowance: users.monthlyEditsAllowance,
      editsResetMonth: users.editsResetMonth,
      unlimitedEditsUntil: users.unlimitedEditsUntil,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return {
      canEdit: false,
      editsRemaining: 0,
      editsUsed: 0,
      editsAllowance: 0,
      hasUnlimitedEdits: false,
      unlimitedEditsUntil: null,
      currentMonth,
    };
  }

  // Check for unlimited edits
  const hasUnlimitedEdits =
    user.unlimitedEditsUntil !== null && user.unlimitedEditsUntil > now;

  if (hasUnlimitedEdits) {
    return {
      canEdit: true,
      editsRemaining: "unlimited",
      editsUsed: user.monthlyEditsUsed,
      editsAllowance: user.monthlyEditsAllowance,
      hasUnlimitedEdits: true,
      unlimitedEditsUntil: user.unlimitedEditsUntil,
      currentMonth,
    };
  }

  // Check if allowance is from current month
  const isCurrentMonth = user.editsResetMonth === currentMonth;
  const editsUsed = isCurrentMonth ? user.monthlyEditsUsed : 0;
  const editsAllowance = isCurrentMonth ? user.monthlyEditsAllowance : 0;
  const editsRemaining = Math.max(0, editsAllowance - editsUsed);

  return {
    canEdit: editsRemaining > 0,
    editsRemaining,
    editsUsed,
    editsAllowance,
    hasUnlimitedEdits: false,
    unlimitedEditsUntil: null,
    currentMonth,
  };
}

/**
 * Consume one edit from the user's allowance
 * Returns true if successful, false if no edits available
 */
export async function consumeEdit(userId: string): Promise<boolean> {
  const allowance = await getUserEditAllowance(userId);

  if (!allowance.canEdit) {
    return false;
  }

  // Unlimited edits don't need to be tracked
  if (allowance.hasUnlimitedEdits) {
    return true;
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Increment edits used
  await db
    .update(users)
    .set({
      monthlyEditsUsed: sql`${users.monthlyEditsUsed} + 1`,
      editsResetMonth: currentMonth,
    })
    .where(eq(users.id, userId));

  return true;
}

/**
 * Reset edit allowance for a new month (called by cron or on demand)
 */
export async function resetMonthlyEdits(userId: string): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [user] = await db
    .select({ editsResetMonth: users.editsResetMonth })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user && user.editsResetMonth !== currentMonth) {
    await db
      .update(users)
      .set({
        monthlyEditsUsed: 0,
        monthlyEditsAllowance: 0,
        editsResetMonth: currentMonth,
      })
      .where(eq(users.id, userId));
  }
}

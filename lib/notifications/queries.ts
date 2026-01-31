import { db } from "@/lib/db";
import { notifications, users, type NotificationMetadata } from "@/lib/db/schema";
import { eq, desc, isNull, and, sql } from "drizzle-orm";

export type NotificationType =
  | "job_application"
  | "application_accepted"
  | "application_rejected"
  | "application_info_requested"
  | "new_message";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  metadata?: NotificationMetadata;
}

/**
 * Create a new notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      metadata: params.metadata || {},
    })
    .returning();

  return notification;
}

/**
 * Get notifications for a user (most recent first)
 */
export async function getNotifications(userId: string, limit = 50) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

  return result[0]?.count || 0;
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning();

  return updated;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

/**
 * Get a user's email notification preferences
 */
export async function getUserNotificationPreferences(userId: string) {
  const [user] = await db
    .select({
      emailOnJobApplication: users.emailOnJobApplication,
      emailOnApplicationUpdate: users.emailOnApplicationUpdate,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user;
}

/**
 * Update a user's email notification preferences
 */
export async function updateUserNotificationPreferences(
  userId: string,
  preferences: {
    emailOnJobApplication?: boolean;
    emailOnApplicationUpdate?: boolean;
  }
) {
  const [updated] = await db
    .update(users)
    .set(preferences)
    .where(eq(users.id, userId))
    .returning({
      emailOnJobApplication: users.emailOnJobApplication,
      emailOnApplicationUpdate: users.emailOnApplicationUpdate,
    });

  return updated;
}

/**
 * Delete old notifications (older than 30 days and read)
 */
export async function cleanupOldNotifications() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await db
    .delete(notifications)
    .where(
      and(
        sql`${notifications.createdAt} < ${thirtyDaysAgo}`,
        sql`${notifications.readAt} IS NOT NULL`
      )
    );
}

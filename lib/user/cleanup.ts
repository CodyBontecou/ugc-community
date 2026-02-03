import { db } from "@/lib/db";
import { users, media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteFromBlob } from "@/lib/storage/blob-client";

export interface CleanupResult {
  success: boolean;
  errors: string[];
  cleaned: {
    mediaFiles: number;
  };
}

/**
 * Clean up external resources associated with a user.
 * Currently this removes media files stored in Vercel Blob.
 */
export async function cleanupUserExternalResources(
  userId: string
): Promise<CleanupResult> {
  const errors: string[] = [];
  const cleaned = {
    mediaFiles: 0,
  };

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userResult.length === 0) {
    return {
      success: false,
      errors: ["User not found"],
      cleaned,
    };
  }

  try {
    const userMedia = await db
      .select({
        id: media.id,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
      })
      .from(media)
      .where(eq(media.userId, userId));

    for (const item of userMedia) {
      try {
        await deleteFromBlob(item.url);
        cleaned.mediaFiles++;

        if (item.thumbnailUrl) {
          await deleteFromBlob(item.thumbnailUrl);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Cleanup] Failed to delete media ${item.id}:`, message);
      }
    }

    if (userMedia.length > 0) {
      console.log(`[Cleanup] Deleted ${cleaned.mediaFiles} media files from Vercel Blob`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    errors.push(`Failed to delete media files: ${message}`);
    console.error(`[Cleanup] Failed to query/delete media files:`, error);
  }

  return {
    success: errors.length === 0,
    errors,
    cleaned,
  };
}

/**
 * Full user deletion with external resource cleanup.
 */
export async function deleteUserWithCleanup(userId: string): Promise<{
  success: boolean;
  cleanupResult: CleanupResult;
  userDeleted: boolean;
}> {
  const cleanupResult = await cleanupUserExternalResources(userId);

  let userDeleted = false;
  try {
    await db.delete(users).where(eq(users.id, userId));
    userDeleted = true;
    console.log(`[Cleanup] Deleted user from database: ${userId}`);
  } catch (error) {
    console.error(`[Cleanup] Failed to delete user from database:`, error);
  }

  return {
    success: cleanupResult.success && userDeleted,
    cleanupResult,
    userDeleted,
  };
}

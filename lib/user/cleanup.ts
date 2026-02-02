import { db } from "@/lib/db";
import { users, media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteProject } from "@/lib/vercel/client";
import { deleteFromBlob } from "@/lib/storage/blob-client";
import { Octokit } from "@octokit/rest";
import { deleteRepo } from "@/lib/github/push-portfolio";

export interface CleanupResult {
  success: boolean;
  errors: string[];
  cleaned: {
    vercelProject: boolean;
    githubRepo: boolean;
    mediaFiles: number;
  };
}

/**
 * Clean up all external resources associated with a user.
 * This should be called BEFORE deleting the user from the database.
 * 
 * External resources cleaned:
 * - Vercel project (if exists)
 * - GitHub repository (if exists)
 * - Vercel Blob media files (if any)
 */
export async function cleanupUserExternalResources(
  userId: string
): Promise<CleanupResult> {
  const errors: string[] = [];
  const cleaned = {
    vercelProject: false,
    githubRepo: false,
    mediaFiles: 0,
  };

  // 1. Get user data to find external resource references
  const userResult = await db
    .select({
      id: users.id,
      vercelProjectId: users.vercelProjectId,
      githubRepoFullName: users.githubRepoFullName,
    })
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

  const user = userResult[0];

  // 2. Delete Vercel project
  if (user.vercelProjectId) {
    try {
      await deleteProject(user.vercelProjectId);
      cleaned.vercelProject = true;
      console.log(`[Cleanup] Deleted Vercel project: ${user.vercelProjectId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      // Don't fail if project doesn't exist (404)
      if (message.includes("404") || message.includes("not found")) {
        console.log(`[Cleanup] Vercel project already deleted or not found: ${user.vercelProjectId}`);
        cleaned.vercelProject = true;
      } else {
        errors.push(`Failed to delete Vercel project: ${message}`);
        console.error(`[Cleanup] Failed to delete Vercel project:`, error);
      }
    }
  }

  // 3. Delete GitHub repository
  if (user.githubRepoFullName) {
    try {
      // Use service token for GitHub operations
      const githubToken = process.env.GITHUB_SERVICE_TOKEN;
      if (githubToken) {
        const octokit = new Octokit({ auth: githubToken });
        await deleteRepo(octokit, user.githubRepoFullName);
        cleaned.githubRepo = true;
        console.log(`[Cleanup] Deleted GitHub repo: ${user.githubRepoFullName}`);
      } else {
        errors.push("GITHUB_SERVICE_TOKEN not configured - cannot delete GitHub repo");
        console.warn(`[Cleanup] No GITHUB_SERVICE_TOKEN - skipping GitHub repo deletion`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      // Don't fail if repo doesn't exist (404)
      if (message.includes("404") || message.includes("Not Found")) {
        console.log(`[Cleanup] GitHub repo already deleted or not found: ${user.githubRepoFullName}`);
        cleaned.githubRepo = true;
      } else {
        errors.push(`Failed to delete GitHub repo: ${message}`);
        console.error(`[Cleanup] Failed to delete GitHub repo:`, error);
      }
    }
  }

  // 4. Delete media files from Vercel Blob
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
        // Delete main file
        await deleteFromBlob(item.url);
        cleaned.mediaFiles++;

        // Delete thumbnail if exists
        if (item.thumbnailUrl) {
          await deleteFromBlob(item.thumbnailUrl);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        // Don't fail on individual file deletion errors
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
 * Cleans up external resources first, then deletes user from database.
 */
export async function deleteUserWithCleanup(userId: string): Promise<{
  success: boolean;
  cleanupResult: CleanupResult;
  userDeleted: boolean;
}> {
  // 1. Clean up external resources first
  const cleanupResult = await cleanupUserExternalResources(userId);

  // 2. Delete user from database (cascades handle related DB records)
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

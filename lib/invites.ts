import { db } from "@/lib/db";
import { invites } from "@/lib/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import crypto from "crypto";

const DEFAULT_EXPIRATION_DAYS = 7;

/**
 * Generates a secure, URL-safe token for invite links
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Creates a new invite in the database
 */
export async function createInvite({
  createdBy,
  email,
  expirationDays = DEFAULT_EXPIRATION_DAYS,
}: {
  createdBy: string;
  email?: string;
  expirationDays?: number;
}) {
  const token = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  const [invite] = await db
    .insert(invites)
    .values({
      token,
      email: email?.toLowerCase(),
      expiresAt,
      createdBy,
    })
    .returning();

  return invite;
}

/**
 * Validates an invite token and returns the invite if valid
 * Returns null if invalid, expired, already used, or revoked
 */
export async function validateInviteToken(token: string) {
  const invite = await db.query.invites.findFirst({
    where: and(
      eq(invites.token, token),
      gt(invites.expiresAt, new Date()),
      isNull(invites.usedAt),
      isNull(invites.revokedAt)
    ),
  });

  return invite;
}

/**
 * Validates an invite token for a specific email
 * If the invite has a pre-assigned email, it must match
 */
export async function validateInviteForEmail(token: string, email: string) {
  const invite = await validateInviteToken(token);

  if (!invite) {
    return { valid: false, error: "Invalid or expired invite" as const };
  }

  if (invite.email && invite.email !== email.toLowerCase()) {
    return { valid: false, error: "Invite is assigned to a different email" as const };
  }

  return { valid: true, invite };
}

/**
 * Marks an invite as used by a user
 */
export async function markInviteAsUsed(inviteId: string, userId: string) {
  await db
    .update(invites)
    .set({
      usedAt: new Date(),
      usedBy: userId,
    })
    .where(eq(invites.id, inviteId));
}

/**
 * Gets an invite by token (without validation)
 */
export async function getInviteByToken(token: string) {
  return db.query.invites.findFirst({
    where: eq(invites.token, token),
  });
}

/**
 * Gets an invite by ID
 */
export async function getInviteById(id: string) {
  return db.query.invites.findFirst({
    where: eq(invites.id, id),
  });
}

/**
 * Lists invites created by a user
 */
export async function listInvites(createdBy: string) {
  return db.query.invites.findMany({
    where: eq(invites.createdBy, createdBy),
    orderBy: (invites, { desc }) => [desc(invites.createdAt)],
    with: {
      usedByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Lists all invites (admin function)
 */
export async function listAllInvites() {
  return db.query.invites.findMany({
    orderBy: (invites, { desc }) => [desc(invites.createdAt)],
    with: {
      creator: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      usedByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Generates the full invite URL
 */
export function getInviteUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/sign-up?invite=${token}`;
}

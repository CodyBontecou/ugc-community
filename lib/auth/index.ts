import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import {
  validateInviteForEmail,
  hasValidInviteForEmail,
  markInviteAsUsed,
} from "@/lib/invites";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Validate invite token on email/password sign-up
      if (ctx.path === "/sign-up/email") {
        // Get invite token from custom header
        const inviteToken = ctx.headers?.get("x-invite-token");
        const email = ctx.body?.email;

        if (!inviteToken) {
          throw new APIError("BAD_REQUEST", {
            message: "An invite is required to sign up",
          });
        }

        if (!email) {
          throw new APIError("BAD_REQUEST", {
            message: "Email is required",
          });
        }

        const result = await validateInviteForEmail(inviteToken, email);

        if (!result.valid) {
          throw new APIError("BAD_REQUEST", {
            message: result.error || "Invalid or expired invite",
          });
        }

        // Store invite ID in context for use in databaseHooks
        ctx.context.pendingInviteId = result.invite?.id;
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        before: async (user, ctx: any) => {
          // For email/password sign-ups, the invite was already validated in hooks.before
          // Check if we have a validated invite ID in the context
          if (ctx?.context?.pendingInviteId) {
            // Already validated via hooks.before, allow the sign-up
            return;
          }

          // For OAuth sign-ups, check if the email has a valid invite
          const email = user.email;
          if (!email) {
            return false; // Reject sign-up without email
          }

          // Check if user already exists (this is a sign-in, not sign-up)
          const existingUser = await db.query.users.findFirst({
            where: eq(schema.users.email, email),
          });

          if (existingUser) {
            // Allow sign-in for existing users
            return;
          }

          // For new OAuth users, check for a valid email-specific invite
          const invite = await hasValidInviteForEmail(email);
          if (!invite) {
            // No valid invite for this email - reject the sign-up
            return false;
          }

          // Store invite ID for after hook
          if (ctx?.context) {
            ctx.context.pendingInviteId = invite.id;
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        after: async (user, ctx: any) => {
          // Mark invite as used after successful user creation
          const pendingInviteId = ctx?.context?.pendingInviteId;

          if (pendingInviteId) {
            // Mark the validated invite as used
            await markInviteAsUsed(pendingInviteId, user.id);
          } else {
            // Fallback: find invite by email
            const email = user.email;
            if (email) {
              const invite = await hasValidInviteForEmail(email);
              if (invite) {
                await markInviteAsUsed(invite.id, user.id);
              }
            }
          }
        },
      },
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
        unique: true,
      },
      displayName: {
        type: "string",
        required: false,
      },
      bio: {
        type: "string",
        required: false,
      },
      websiteUrl: {
        type: "string",
        required: false,
      },
      instagramHandle: {
        type: "string",
        required: false,
      },
      tiktokHandle: {
        type: "string",
        required: false,
      },
      youtubeHandle: {
        type: "string",
        required: false,
      },
      twitterHandle: {
        type: "string",
        required: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://ugc.community",
    "https://*.ugc.community",
  ],
});

export type Session = typeof auth.$Infer.Session;

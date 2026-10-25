import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { Resend } from "resend";

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@ugc.community";
const FROM_NAME = process.env.FROM_NAME || "ugc.community";

function generateMagicLinkEmail(url: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #FFFBF9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFBF9;">
    <tr>
      <td align="center" style="padding: 48px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; box-shadow: 0 8px 40px rgba(26, 22, 20, 0.08);">
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #FF9A8B 0%, #FF6B95 50%, #A855F7 100%); border-radius: 24px 24px 0 0;"></td>
          </tr>
          <tr>
            <td align="center" style="padding: 48px 40px 0 40px;">
              <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 400; color: #1A1614; letter-spacing: -0.02em;">ugc.community</span>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 40px 40px 0 40px;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 400; line-height: 1.2; color: #1A1614;">
                Sign in to ugc.community
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 0 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #625850;">
                Click the button below to sign in. This link will expire in 5 minutes.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 50px; background: linear-gradient(135deg, #FF9A8B 0%, #FF6B95 100%); box-shadow: 0 4px 16px rgba(255, 107, 149, 0.3);">
                    <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                      Sign In
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #A69B91;">
                If you didn't request this link, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px 48px 40px;">
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; color: #1A1614;">
                — The ugc.community team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

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
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: email,
          subject: "Sign in to ugc.community",
          html: generateMagicLinkEmail(url),
        });
        if (error) {
          const providerMessage = error.message.split(process.env.RESEND_API_KEY || "__no_key__").join("[redacted]").slice(0, 400);
          console.error("Magic-link email rejected", { name: error.name, statusCode: error.statusCode, message: providerMessage });
          throw new Error("Could not send sign-in link");
        }
      },
      expiresIn: 60 * 5, // 5 minutes
      disableSignUp: false,
    }),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      enabled: !!process.env.GOOGLE_CLIENT_ID,
      disableSignUp: true,
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
      role: {
        type: "string",
        required: false,
        defaultValue: "creator",
      },
      // Note: Social handles (instagramHandles, tiktokHandles, youtubeHandles, twitterHandles)
      // are stored as arrays in the database and managed via the admin API.
      // Better Auth doesn't support array types in additionalFields.
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
  onAPIError: {
    errorURL: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/auth/error`,
  },
});

export type Session = typeof auth.$Infer.Session;

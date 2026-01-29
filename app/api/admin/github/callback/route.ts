import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.redirect(
        new URL("/login?error=unauthorized", request.url)
      );
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.redirect(
        new URL("/dashboard?error=forbidden", request.url)
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("GitHub OAuth error:", error);
      return NextResponse.redirect(
        new URL(
          `/dashboard/admin?github_error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    // Verify code and state
    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/admin?github_error=invalid_request", request.url)
      );
    }

    // Verify state matches user ID
    if (state !== session.user.id) {
      return NextResponse.redirect(
        new URL("/dashboard/admin?github_error=state_mismatch", request.url)
      );
    }

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return NextResponse.redirect(
        new URL("/dashboard/admin?github_error=not_configured", request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      console.error("GitHub token exchange failed:", await tokenResponse.text());
      return NextResponse.redirect(
        new URL("/dashboard/admin?github_error=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("GitHub token error:", tokenData.error);
      return NextResponse.redirect(
        new URL(
          `/dashboard/admin?github_error=${encodeURIComponent(tokenData.error)}`,
          request.url
        )
      );
    }

    const { access_token, refresh_token } = tokenData;

    // Fetch GitHub user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      console.error("GitHub user fetch failed:", await userResponse.text());
      return NextResponse.redirect(
        new URL("/dashboard/admin?github_error=user_fetch_failed", request.url)
      );
    }

    const githubUser = await userResponse.json();

    // Update user record with GitHub connection
    await db
      .update(users)
      .set({
        githubAccessToken: access_token,
        githubRefreshToken: refresh_token || null,
        githubUsername: githubUser.login,
        githubConnectedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // Redirect back to admin panel with success
    return NextResponse.redirect(
      new URL("/dashboard/admin?github_connected=true", request.url)
    );
  } catch (error) {
    console.error("GitHub callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/admin?github_error=internal_error", request.url)
    );
  }
}

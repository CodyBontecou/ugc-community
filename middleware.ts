import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// AI and scraper bots to block at the edge
const BLOCKED_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "anthropic-ai",
  "Claude-Web",
  "ClaudeBot",
  "CCBot",
  "Google-Extended",
  "cohere-ai",
  "Bytespider",
  "PerplexityBot",
  "YouBot",
  "Diffbot",
];

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const pathname = request.nextUrl.pathname;

  // Redirect Better Auth's default error page to our custom one
  if (pathname === "/api/auth/error") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/error";
    return NextResponse.redirect(url);
  }

  // Block known AI bots from API routes
  if (pathname.startsWith("/api/")) {
    const isBlockedBot = BLOCKED_USER_AGENTS.some((bot) =>
      userAgent.toLowerCase().includes(bot.toLowerCase())
    );

    if (isBlockedBot) {
      return new NextResponse("Access denied", { status: 403 });
    }
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Prevent search engines from indexing API routes
  if (pathname.startsWith("/api/")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

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

// Hosts that are NOT portfolio subdomains
const NON_PORTFOLIO_HOSTS = new Set(["www", "ugc", "app"]);

/**
 * Extract portfolio subdomain from the Host header.
 * Returns null if this is a main app request (apex, www, localhost, etc.)
 *
 * Examples:
 *   johndoe.ugc.community → "johndoe"
 *   www.ugc.community → null
 *   ugc.community → null
 *   localhost:3000 → null (use ?subdomain= for dev testing)
 */
function getPortfolioSubdomain(request: NextRequest): string | null {
  const host = request.headers.get("host") || "";

  // Dev mode: support ?subdomain=johndoe on localhost
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    const subdomain = request.nextUrl.searchParams.get("subdomain");
    return subdomain || null;
  }

  // Production: only treat direct children of our configured domain as
  // portfolio subdomains. Preview hosts such as *.workers.dev must continue
  // through the main app instead of being mistaken for creator portfolios.
  const hostname = host.split(":")[0].toLowerCase();
  const baseDomain = (process.env.NEXT_PUBLIC_DOMAIN || "ugc.community").toLowerCase();
  const suffix = `.${baseDomain}`;

  if (!hostname.endsWith(suffix)) return null;

  const subdomain = hostname.slice(0, -suffix.length);

  // Only direct subdomains are creator portfolios.
  if (!subdomain || subdomain.includes(".")) return null;

  // Skip known non-portfolio subdomains
  if (NON_PORTFOLIO_HOSTS.has(subdomain)) return null;

  return subdomain;
}

export function middleware(request: NextRequest) {
  // =====================================================
  // Portfolio Subdomain Detection (must be first)
  // =====================================================
  const portfolioSubdomain = getPortfolioSubdomain(request);

  if (portfolioSubdomain) {
    // Rewrite to the portfolio serving route
    let pathname = request.nextUrl.pathname;

    // Default to index.html for root requests
    if (pathname === "/" || pathname === "") {
      pathname = "/index.html";
    }

    const url = request.nextUrl.clone();
    url.pathname = `/api/portfolio-serve/${portfolioSubdomain}${pathname}`;

    // Strip the subdomain query param in dev mode so it doesn't pass through
    url.searchParams.delete("subdomain");

    // Return early — don't apply main app middleware to portfolio requests
    return NextResponse.rewrite(url);
  }

  // =====================================================
  // Main App Middleware (non-portfolio requests)
  // =====================================================
  const userAgent = request.headers.get("user-agent") || "";
  const pathname = request.nextUrl.pathname;

  // Fallback: Redirect Better Auth's default error page to our custom one
  // (onAPIError.errorURL handles this normally, but this catches edge cases)
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
  response.headers.set("Content-Security-Policy", "frame-ancestors *");
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
     *
     * NOTE: We intentionally DO NOT exclude favicon.ico, .png, .ico etc.
     * because portfolio subdomains need those to be routed through middleware
     * to the blob serving route. The main app's favicon.ico is served directly
     * by Next.js from /public before middleware runs.
     */
    "/((?!_next/static|_next/image).*)",
  ],
};

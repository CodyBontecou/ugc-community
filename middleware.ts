import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Reserved subdomains that should not be used for portfolios
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "auth",
  "login",
  "signup",
  "sign-in",
  "sign-up",
  "register",
  "help",
  "support",
  "blog",
  "docs",
  "mail",
  "email",
  "cdn",
  "static",
  "assets",
  "media",
  "images",
  "files",
  "status",
  "dev",
  "staging",
  "test",
  "demo",
]);

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // Get the base domain from environment or default
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "ugc.community";

  // For local development, we need to handle different scenarios
  const isLocalhost =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");

  let subdomain: string | null = null;

  if (isLocalhost) {
    // For local development: check for subdomain in the format subdomain.localhost:3000
    // Or use query parameter ?subdomain=username for easier testing
    const querySubdomain = url.searchParams.get("subdomain");
    if (querySubdomain) {
      subdomain = querySubdomain;
      url.searchParams.delete("subdomain");
    } else {
      // Check for subdomain.localhost:port pattern
      const parts = hostname.split(".");
      if (parts.length > 1 && parts[0] !== "localhost") {
        subdomain = parts[0];
      }
    }
  } else {
    // Production: extract subdomain from hostname
    // e.g., username.ugc.community -> username
    const hostnameWithoutPort = hostname.split(":")[0];

    if (hostnameWithoutPort.endsWith(baseDomain)) {
      const potentialSubdomain = hostnameWithoutPort.replace(
        `.${baseDomain}`,
        ""
      );

      // Make sure it's actually a subdomain and not the base domain itself
      if (potentialSubdomain && potentialSubdomain !== baseDomain) {
        subdomain = potentialSubdomain;
      }
    }
  }

  // If we have a subdomain and it's not reserved, rewrite to the portfolio route
  if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain.toLowerCase())) {
    // Don't rewrite API routes or static files
    if (
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/_next/") ||
      url.pathname.startsWith("/static/") ||
      url.pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    // Rewrite to the portfolio subdomain route
    // Use dedicated subdomain route to distinguish from username-based lookups
    const newPathname =
      url.pathname === "/"
        ? `/s/${subdomain}`
        : `/s/${subdomain}${url.pathname}`;

    url.pathname = newPathname;

    // Add header to indicate this is a subdomain request (useful for debugging)
    const response = NextResponse.rewrite(url);
    response.headers.set("x-subdomain", subdomain.toLowerCase());
    return response;
  }

  return NextResponse.next();
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

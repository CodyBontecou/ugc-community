import { z } from "zod";

// Subdomain format requirements (must match DB constraint):
// - 3-63 characters
// - Alphanumeric and hyphens only
// - Cannot start or end with hyphen
// - Lowercase only
const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export const subdomainSchema = z
  .string()
  .min(3, "Subdomain must be at least 3 characters")
  .max(63, "Subdomain must be at most 63 characters")
  .regex(
    SUBDOMAIN_REGEX,
    "Subdomain can only contain lowercase letters, numbers, and hyphens (cannot start or end with hyphen)"
  )
  .transform((val) => val.toLowerCase());

// Reserved subdomains that cannot be claimed (system routes, common services)
export const RESERVED_SUBDOMAINS = new Set([
  // System/infrastructure
  "admin",
  "api",
  "www",
  "app",
  "mail",
  "email",
  "smtp",
  "ftp",
  "ssh",
  "dns",
  "ns1",
  "ns2",
  "cdn",
  "static",
  "assets",
  "media",
  "images",
  "files",
  "upload",
  "uploads",
  "download",
  "downloads",

  // Authentication/accounts
  "auth",
  "login",
  "logout",
  "signin",
  "signout",
  "signup",
  "sign-in",
  "sign-up",
  "sign-out",
  "register",
  "oauth",
  "sso",
  "account",
  "accounts",
  "user",
  "users",
  "profile",
  "profiles",

  // Application routes
  "dashboard",
  "settings",
  "help",
  "support",
  "contact",
  "about",
  "blog",
  "news",
  "docs",
  "documentation",
  "status",
  "health",
  "ping",

  // Business/legal
  "terms",
  "privacy",
  "legal",
  "billing",
  "payment",
  "payments",
  "subscribe",
  "pricing",

  // Features
  "portfolio",
  "portfolios",
  "discover",
  "explore",
  "search",
  "directory",
  "creators",
  "create",

  // Common reserved
  "test",
  "demo",
  "example",
  "sample",
  "null",
  "undefined",
  "true",
  "false",
  "root",
  "localhost",
  "local",
  "dev",
  "staging",
  "prod",
  "production",
]);

export type SubdomainValidationResult = {
  valid: boolean;
  error?: string;
  normalized?: string;
};

/**
 * Validates a subdomain string against all rules:
 * - Format (length, characters, no leading/trailing hyphens)
 * - Reserved words
 *
 * Returns normalized (lowercase) subdomain if valid.
 */
export function validateSubdomain(input: string): SubdomainValidationResult {
  // Normalize to lowercase first
  const normalized = input.toLowerCase().trim();

  // Check format with Zod schema
  const parseResult = subdomainSchema.safeParse(normalized);
  if (!parseResult.success) {
    return {
      valid: false,
      error: parseResult.error.issues[0]?.message || "Invalid subdomain format",
    };
  }

  // Check reserved words
  if (RESERVED_SUBDOMAINS.has(normalized)) {
    return {
      valid: false,
      error: "This subdomain is reserved",
    };
  }

  return {
    valid: true,
    normalized: parseResult.data,
  };
}

/**
 * Generates suggestions for similar available subdomains
 */
export function generateSubdomainSuggestions(base: string): string[] {
  const suggestions: string[] = [];
  const normalized = base.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (normalized.length >= 3) {
    // Add number suffix
    suggestions.push(`${normalized}1`);
    suggestions.push(`${normalized}2`);
    suggestions.push(`${normalized}123`);

    // Add year suffix
    const year = new Date().getFullYear();
    suggestions.push(`${normalized}${year}`);

    // Add "the" prefix if room
    if (normalized.length <= 59) {
      suggestions.push(`the${normalized}`);
    }

    // Add "my" prefix if room
    if (normalized.length <= 60) {
      suggestions.push(`my${normalized}`);
    }
  }

  // Filter out any that are reserved
  return suggestions
    .filter((s) => s.length >= 3 && s.length <= 63)
    .filter((s) => !RESERVED_SUBDOMAINS.has(s))
    .slice(0, 5);
}

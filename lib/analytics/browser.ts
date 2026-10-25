// Browser-safe analytics contracts; validation stays on the server.
export const CONSENT_KEY = "ugc.analytics.consent";
export const SESSION_COOKIE = "ugc_analytics_session";
export const SESSION_SECONDS = 30 * 60;
export const RETENTION_DAYS = 90;
export const BROWSER_EVENTS = [
  "page_view", "page_engagement", "scroll_depth", "job_brief_open", "apply_click",
  "source_click", "navigation_click", "form_start", "form_submit", "form_error",
  "job_search", "profile_draft", "application_preview",
] as const;
export const SERVER_EVENTS = ["profile_saved", "application_sent", "job_submitted"] as const;
export const SOURCES = ["direct", "internal", "chatgpt", "perplexity", "claude", "copilot", "gemini", "google", "bing", "social", "other"] as const;
export type Source = typeof SOURCES[number];
export type Device = "mobile" | "tablet" | "desktop";
export type BrowserEvent = typeof BROWSER_EVENTS[number];
export type ServerEvent = typeof SERVER_EVENTS[number];

// An allowlist of route templates prevents tokens, usernames, and share IDs being stored.
export function analyticsPath(value: string): string | null {
  const path = value.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  if (["/", "/jobs", "/post-job", "/apply-profile", "/sign-in", "/sign-up", "/about", "/contact", "/guide", "/docs", "/database", "/privacy", "/terms", "/dashboard", "/dashboard/settings"].includes(path)) return path;
  if (/^\/jobs\/[^/]+\/apply$/.test(path)) return "/jobs/:id/apply";
  if (/^\/creator-profile\/[^/]+$/.test(path)) return "/creator-profile/:id";
  if (/^\/(guide|docs)\/[a-z0-9-]+$/.test(path)) return `/${path.split("/")[1]}/:slug`;
  return null;
}
export function referralSource(referrer: string, origin: string): Source {
  if (!referrer) return "direct";
  try {
    const url = new URL(referrer);
    if (url.origin === origin) return "internal";
    const host = url.hostname.toLowerCase();
    const matches = (domains: string[]) => domains.some(domain => host === domain || host.endsWith(`.${domain}`));
    if (matches(["chatgpt.com", "chat.openai.com"])) return "chatgpt";
    if (matches(["perplexity.ai"])) return "perplexity";
    if (matches(["claude.ai"])) return "claude";
    if (matches(["copilot.microsoft.com"])) return "copilot";
    if (matches(["gemini.google.com"])) return "gemini";
    if (matches(["google.com"])) return "google";
    if (matches(["bing.com"])) return "bing";
    if (matches(["instagram.com", "tiktok.com", "youtube.com", "reddit.com", "facebook.com", "linkedin.com", "twitter.com", "x.com"])) return "social";
    return "other";
  } catch { return "other"; }
}

export type { EventProperties, EventBatch } from "./model";

import { z } from "zod";

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
export const propertiesSchema = z.object({
  jobId: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/).optional(),
  destination: z.enum(["external", "email", "profile", "jobs", "post-job", "sign-in", "sign-up", "other"]).optional(),
  form: z.enum(["search", "profile", "application", "job", "sign-in", "sign-up", "contact"]).optional(),
  depth: z.union([z.literal(25), z.literal(50), z.literal(75), z.literal(100)]).optional(),
  seconds: z.number().int().min(0).max(60).optional(),
  hasQuery: z.boolean().optional(),
  pay: z.enum(["cash", "mixed", "gifted_or_unpaid", "affiliate", "performance_only", "unspecified", "other", "all"]).optional(),
  source: z.enum(["external", "direct", "all"]).optional(),
  page: z.number().int().min(1).max(10000).optional(),
}).strict();
export type EventProperties = z.infer<typeof propertiesSchema>;
export const eventSchema = z.object({
  id: z.uuid(), occurredAt: z.iso.datetime(), name: z.enum(BROWSER_EVENTS), path: z.string().max(300).refine(value => analyticsPath(value) !== null),
  properties: propertiesSchema.default({}),
}).strict();
export const batchSchema = z.object({
  consent: z.literal(true), sessionId: z.uuid(), source: z.enum(SOURCES),
  device: z.enum(["mobile", "tablet", "desktop"]), events: z.array(eventSchema).min(1).max(20),
}).strict();
export type EventBatch = z.infer<typeof batchSchema>;
export function reportDays(value: string | null | undefined): number {
  return [7, 30, 90].includes(Number(value)) ? Number(value) : 30;
}
export function privacySignal(headers: Headers) {
  return headers.get("dnt") === "1" || headers.get("sec-gpc") === "1";
}
export function sessionCookie(headers: Headers): string | null {
  const value = headers.get("cookie")?.split(";").map(item => item.trim()).find(item => item.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  return value && z.uuid().safeParse(value).success ? value : null;
}

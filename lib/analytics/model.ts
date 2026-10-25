import { z } from "zod";

import { BROWSER_EVENTS, SOURCES, SESSION_COOKIE, analyticsPath } from "./browser";
export { CONSENT_KEY, SESSION_COOKIE, SESSION_SECONDS, RETENTION_DAYS, BROWSER_EVENTS, SERVER_EVENTS, SOURCES, analyticsPath, referralSource } from "./browser";
export type { Source, Device, BrowserEvent, ServerEvent } from "./browser";

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

"use client";
import { CONSENT_KEY, SESSION_COOKIE, SESSION_SECONDS, referralSource, analyticsPath, type BrowserEvent, type EventProperties, type EventBatch } from "./model";

type QueuedEvent = EventBatch["events"][number];
let queue: QueuedEvent[] = [];
let inFlight = false;
let retryAfter = 0;
const SESSION_KEY = "ugc.analytics.session";

export function trackingAllowed() {
  if (typeof window === "undefined") return false;
  if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return false;
  try { return localStorage.getItem(CONSENT_KEY) === "granted"; } catch { return false; }
}
export function setTrackingConsent(granted: boolean) {
  try { localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied"); } catch { /* Storage disabled: remain off. */ }
  if (!granted) clearTracking();
  window.dispatchEvent(new Event("analytics-consent"));
}
export function clearTracking() {
  queue = [];
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Optional storage. */ }
}
function context() {
  let id = document.cookie.split(";").map(v => v.trim()).find(v => v.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!id || !/^[a-f0-9-]{36}$/i.test(id)) id = crypto.randomUUID();
  document.cookie = `${SESSION_COOKIE}=${id}; Path=/; Max-Age=${SESSION_SECONDS}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  let source = referralSource(document.referrer, location.origin);
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    if (saved?.id === id) source = saved.source;
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, source }));
  } catch { /* Referral remains coarse if storage is unavailable. */ }
  const device = matchMedia("(max-width: 767px)").matches ? "mobile" : matchMedia("(max-width: 1023px)").matches ? "tablet" : "desktop";
  return { sessionId: id, source, device } as const;
}
export function track(name: BrowserEvent, properties: EventProperties = {}, pathOverride?: string) {
  if (!trackingAllowed()) { clearTracking(); return; }
  const path = analyticsPath(pathOverride || location.pathname);
  if (!path) return;
  context(); // Ensure the consented session cookie exists before business requests.
  queue.push({ id: crypto.randomUUID(), occurredAt: new Date().toISOString(), name, path, properties });
  queue = queue.slice(-100);
  if (queue.length >= 10) void flush();
}
export async function flush(beacon = false) {
  if (!trackingAllowed()) { clearTracking(); return; }
  if (!queue.length || (!beacon && (inFlight || Date.now() < retryAfter))) return;
  const events = queue.splice(0, 20);
  const body = JSON.stringify({ consent: true, ...context(), events });
  if (beacon && navigator.sendBeacon?.("/api/analytics/events", new Blob([body], { type: "application/json" }))) return;
  inFlight = true;
  try {
    const response = await fetch("/api/analytics/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    if (!response.ok) {
      retryAfter = Date.now() + (response.status === 429 ? 60_000 : 15_000);
      if (response.status >= 500 || response.status === 429) queue = [...events, ...queue].slice(-100);
    }
  } catch { queue = [...events, ...queue].slice(-100); retryAfter = Date.now() + 15_000; }
  finally { inFlight = false; }
}

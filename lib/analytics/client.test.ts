import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { CONSENT_KEY, SESSION_COOKIE, batchSchema } from "./model";
import { clearTracking, flush, setTrackingConsent, track, trackingAllowed } from "./client";
const originals = new Map<string, PropertyDescriptor | undefined>();
const local = new Map<string, string>(), session = new Map<string, string>();
const storage = (map: Map<string, string>) => ({ getItem: (key: string) => map.get(key) || null, setItem: (key: string, value: string) => map.set(key, value), removeItem: (key: string) => map.delete(key) });
let cookie = "", requests: string[] = [];
const nav = { doNotTrack: "0", globalPrivacyControl: false, sendBeacon: () => false };
function install(key: string, value: unknown) {
  originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
}
before(() => {
  install("window", new EventTarget()); install("navigator", nav);
  install("localStorage", storage(local)); install("sessionStorage", storage(session));
  install("document", { get cookie() { return cookie; }, set cookie(value: string) { cookie = value.split(";")[0]; }, referrer: "https://chatgpt.com/c/private-conversation" });
  install("location", { pathname: "/jobs", origin: "https://ugc.community", protocol: "https:" });
  install("matchMedia", () => ({ matches: false }));
  install("fetch", async (_url: string, init: RequestInit) => { requests.push(String(init.body)); return new Response(null, { status: 204 }); });
});
after(() => { for (const [key, descriptor] of originals) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); });
beforeEach(() => { local.clear(); session.clear(); requests = []; cookie = ""; nav.doNotTrack = "0"; nav.globalPrivacyControl = false; clearTracking(); });
test("no activity is sent without explicit consent", async () => {
  assert.equal(trackingAllowed(), false); track("page_view"); await flush();
  assert.equal(requests.length, 0); assert.equal(cookie, `${SESSION_COOKIE}=`);
});
test("opt-in sends a validated anonymous session and coarse referrer", async () => {
  setTrackingConsent(true); track("page_view"); track("job_search", { hasQuery: true, pay: "cash" }); await flush();
  assert.equal(requests.length, 1);
  const payload = batchSchema.parse(JSON.parse(requests[0]));
  assert.equal(payload.events.length, 2); assert.equal(payload.source, "chatgpt");
  assert.equal(cookie, `${SESSION_COOKIE}=${payload.sessionId}`);
  assert.doesNotMatch(requests[0], /private-conversation|https:\/\/chatgpt/);
});
test("withdrawal drops queued events and clears the session", async () => {
  setTrackingConsent(true); track("page_view"); setTrackingConsent(false); await flush();
  assert.equal(requests.length, 0); assert.equal(local.get(CONSENT_KEY), "denied");
  assert.equal(cookie, `${SESSION_COOKIE}=`);
});
test("browser privacy signals override previous opt-in", async () => {
  setTrackingConsent(true); nav.globalPrivacyControl = true;
  track("page_view"); await flush(); assert.equal(requests.length, 0);
  nav.globalPrivacyControl = false; nav.doNotTrack = "1";
  track("page_view"); await flush(); assert.equal(requests.length, 0);
});
test("departing page engagement retains its original route", async () => {
  setTrackingConsent(true);
  track("page_engagement", { seconds: 8 }, "/about");
  await flush();
  assert.equal(JSON.parse(requests[0]).events[0].path, "/about");
});

import { CONSENT_KEY } from "../analytics/browser";
import { clearTracking, setTrackingConsent, trackingAllowed } from "../analytics/client";
let stop: (() => void) | undefined;
const prompt = document.querySelector<HTMLElement>(".analytics-consent-prompt");
let generation = 0;
async function update() {
  const current = ++generation;
  const signal = navigator.doNotTrack === "1" || Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl);
  let chosen = true;
  try { chosen = localStorage.getItem(CONSENT_KEY) !== null; } catch { /* Remain off. */ }
  if (prompt) prompt.hidden = chosen || signal;
  stop?.(); stop = undefined;
  if (!trackingAllowed()) { clearTracking(); return; }
  const { observePage } = await import("../analytics/observe-page");
  if (current === generation && trackingAllowed()) stop = observePage(location.pathname, location.search.slice(1));
}
document.querySelectorAll<HTMLButtonElement>("[data-consent]").forEach(button => button.addEventListener("click", () => setTrackingConsent(button.dataset.consent === "granted")));
window.addEventListener("analytics-consent", () => void update());
window.addEventListener("pageshow", event => { if (event.persisted) void update(); });
window.addEventListener("storage", () => void update());
void update();
if (document.cookie.split(";").some(c => /^(?:__Secure-)?better-auth\.session_token=/.test(c.trim()))) {
  void fetch("/api/auth/get-session", { credentials: "same-origin", cache: "no-store" }).then(r => r.ok ? r.json() : null).then(session => {
    const link = document.querySelector<HTMLAnchorElement>("#public-account");
    if (link && session?.user) { link.href = "/dashboard"; link.textContent = "Dashboard"; link.setAttribute("aria-label", "Open your dashboard"); }
  }).catch(() => {});
}

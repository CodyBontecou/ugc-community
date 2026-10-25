"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CONSENT_KEY, analyticsPath, type EventProperties } from "@/lib/analytics/browser";
import { clearTracking, flush, setTrackingConsent, track, trackingAllowed } from "@/lib/analytics/client";

function formType(path: string, form: HTMLFormElement): EventProperties["form"] {
  if (form.getAttribute("role") === "search") return "search";
  if (path === "/apply-profile") return "profile";
  if (path === "/post-job") return "job";
  if (/^\/jobs\/[^/]+\/apply$/.test(path)) return "application";
  if (path === "/sign-in" || path === "/sign-up" || path === "/contact") return path.slice(1) as "sign-in" | "sign-up" | "contact";
}
export function BehaviorAnalytics() {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const [consent, setConsent] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [signal, setSignal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const update = () => {
      try { setConsent(localStorage.getItem(CONSENT_KEY)); } catch { setConsent("denied"); }
      setAllowed(trackingAllowed());
      setSignal(navigator.doNotTrack === "1" || Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl));
      setReady(true);
      if (!trackingAllowed()) clearTracking();
    };
    update();
    window.addEventListener("analytics-consent", update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener("analytics-consent", update); window.removeEventListener("storage", update); };
  }, []);
  useEffect(() => {
    if (!allowed || !analyticsPath(pathname)) return;
    track("page_view");
    if (["/", "/jobs"].includes(pathname)) {
      const search = new URLSearchParams(query);
      if (["q", "source", "pay", "page"].some(key => search.has(key))) {
        const pay = search.get("pay") || "all", source = search.get("source") || "all";
        track("job_search", { hasQuery: Boolean(search.get("q")), pay: ["cash", "mixed", "gifted_or_unpaid", "affiliate", "performance_only", "unspecified", "all"].includes(pay) ? pay as EventProperties["pay"] : "other", source: ["external", "direct"].includes(source) ? source as "external" | "direct" : "all", page: Math.min(10000, Math.max(1, Math.floor(Number(search.get("page")) || 1))) });
      }
    }
    let activeSeconds = 0;
    const depths = new Set<number>();
    const started = new WeakSet<HTMLFormElement>();
    const clicked = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest("a,button");
      if (!target || target.closest("[data-analytics-ignore]")) return;
      const controls = target.getAttribute("aria-controls");
      if (controls?.startsWith("job-details-") && target.getAttribute("aria-expanded") === "false") {
        track("job_brief_open", { jobId: controls.slice("job-details-".length) });
        return;
      }
      if (target instanceof HTMLAnchorElement) {
        const url = new URL(target.href, location.origin);
        const jobId = target.closest("[data-analytics-job-id]")?.getAttribute("data-analytics-job-id")
          || pathname.match(/^\/jobs\/([^/]+)\/apply$/)?.[1];
        const emailApply = url.origin === location.origin && /^\/jobs\/[^/]+\/apply$/.test(url.pathname);
        if (jobId && (emailApply || url.origin !== location.origin)) {
          // The source link is a separate intent from applying to a job.
          const source = target.textContent?.trim() === "View original source";
          track(source ? "source_click" : "apply_click", { jobId, destination: emailApply ? "email" : "external" });
        } else if (url.origin === location.origin) {
          const destination = url.pathname === "/apply-profile" ? "profile" : url.pathname === "/jobs" || url.pathname === "/" ? "jobs" : ["/post-job", "/sign-in", "/sign-up"].includes(url.pathname) ? url.pathname.slice(1) as "post-job" | "sign-in" | "sign-up" : "other";
          track("navigation_click", { destination });
        }
        void flush(true);
      }
    };
    const disclosure = (event: Event) => {
      if (!(event.target instanceof HTMLDetailsElement) || !event.target.open) return;
      const jobId = event.target.closest("[data-analytics-job-id]")?.getAttribute("data-analytics-job-id");
      if (jobId) track("job_brief_open", { jobId });
    };
    const focus = (event: FocusEvent) => {
      const form = event.target instanceof Element ? event.target.closest("form") : null;
      if (!form || started.has(form)) return;
      const type = formType(pathname, form);
      if (type) { started.add(form); track("form_start", { form: type }); }
    };
    const submit = (event: SubmitEvent) => {
      if (!(event.target instanceof HTMLFormElement)) return;
      const form = formType(pathname, event.target);
      if (form) { track("form_submit", { form }); void flush(true); }
    };
    const errors = new WeakSet<Element>();
    const observeErrors = () => {
      document.querySelectorAll("form [role='alert']").forEach(element => {
        if (errors.has(element)) return;
        errors.add(element);
        const form = element.closest("form");
        const type = form && formType(pathname, form);
        if (type) track("form_error", { form: type });
      });
    };
    const observer = new MutationObserver(observeErrors);
    observer.observe(document.body, { childList: true, subtree: true });
    const invalidAt = new WeakMap<HTMLFormElement, number>();
    const invalid = (event: Event) => {
      const form = event.target instanceof Element ? event.target.closest("form") : null;
      const type = form && formType(pathname, form);
      if (type && form && Date.now() - (invalidAt.get(form) || 0) > 1000) { invalidAt.set(form, Date.now()); track("form_error", { form: type }); }
    };
    const tick = () => {
      if (document.visibilityState !== "visible" || !document.hasFocus()) return;
      if (++activeSeconds >= 15) { track("page_engagement", { seconds: activeSeconds }, pathname); activeSeconds = 0; }
      const height = document.documentElement.scrollHeight;
      const percent = Math.min(100, Math.round((window.scrollY + window.innerHeight) / height * 100));
      for (const depth of [25, 50, 75, 100] as const) if (percent >= depth && !depths.has(depth)) {
        depths.add(depth); track("scroll_depth", { depth });
      }
    };
    const hide = () => {
      if (document.visibilityState === "hidden") {
        if (activeSeconds) { track("page_engagement", { seconds: activeSeconds }, pathname); activeSeconds = 0; }
        void flush(true);
      }
    };
    const timer = setInterval(tick, 1000), sender = setInterval(() => void flush(), 5000);
    document.addEventListener("invalid", invalid, true);
    document.addEventListener("toggle", disclosure, true);
    document.addEventListener("click", clicked, true);
    document.addEventListener("focusin", focus);
    document.addEventListener("submit", submit, true);
    document.addEventListener("visibilitychange", hide);
    const leave = () => { if (activeSeconds) { track("page_engagement", { seconds: activeSeconds }, pathname); activeSeconds = 0; } void flush(true); };
    window.addEventListener("pagehide", leave);
    return () => {
      if (activeSeconds) track("page_engagement", { seconds: activeSeconds }, pathname);
      void flush(true);
      clearInterval(timer); clearInterval(sender);
      observer.disconnect();
      document.removeEventListener("invalid", invalid, true);
      document.removeEventListener("toggle", disclosure, true);
      document.removeEventListener("click", clicked, true);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("submit", submit, true);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", leave);
    };
  }, [allowed, pathname, query]);
  const choose = (granted: boolean) => { setTrackingConsent(granted); setEditing(false); };
  return <>
    {ready && (consent === null || editing) && !signal && <aside aria-label="Analytics preferences" data-analytics-ignore className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-warm-gray-200 bg-white p-4 shadow-lg">
      <p className="font-semibold text-warm-gray-900">Help improve ugc.community</p>
      <p className="mt-2 text-sm text-warm-gray-600">Allow anonymous traffic and activity measurement? We track pages and actions, never your form entries. You can change this anytime in <a href="/privacy" className="underline">Privacy</a>.</p>
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => choose(true)} className="rounded-lg bg-warm-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-warm-gray-700 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2">Allow analytics</button><button type="button" onClick={() => choose(false)} className="rounded-lg border border-warm-gray-200 px-3 py-2 text-sm font-semibold hover:bg-warm-gray-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2">No thanks</button></div>
    </aside>}
    {pathname === "/privacy" && <div data-analytics-ignore className="fixed bottom-4 right-4 z-40"><button type="button" onClick={() => setEditing(true)} disabled={signal} title={signal ? "Analytics is disabled by your browser privacy signal" : undefined} className="rounded-lg border border-warm-gray-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-warm-gray-50 focus-visible:outline-2">{signal ? "Analytics disabled by browser" : "Analytics preferences"}</button></div>}
  </>;
}

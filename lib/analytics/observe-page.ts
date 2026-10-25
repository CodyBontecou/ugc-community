import { analyticsPath, type EventProperties } from "./browser";
import { observeListingImpressions } from "./impressions";
import { track, flush } from "./client";
function formType(path: string, form: HTMLFormElement): EventProperties["form"] {
  if (form.getAttribute("role") === "search") return "search";
  if (path === "/apply-profile") return "profile";
  if (path === "/post-job") return "job";
  if (/^\/jobs\/[^/]+\/apply$/.test(path)) return "application";
  if (path === "/sign-in" || path === "/sign-up" || path === "/contact") return path.slice(1) as "sign-in" | "sign-up" | "contact";
}
export function observePage(pathname: string, query: string) {
  if (!analyticsPath(pathname)) return () => {};
  void import("./vitals").then(({ observeVitals }) => observeVitals());
    track("page_view");
    if (["/", "/jobs"].includes(pathname)) {
      const search = new URLSearchParams(query);
      if (["q", "source", "pay", "page"].some(key => search.has(key))) {
        const pay = search.get("pay") || "all", source = search.get("source") || "all";
        track("job_search", { hasQuery: Boolean(search.get("q")), pay: ["cash", "mixed", "gifted_or_unpaid", "affiliate", "performance_only", "unspecified", "all"].includes(pay) ? pay as EventProperties["pay"] : "other", source: ["external", "direct"].includes(source) ? source as "external" | "direct" : "all", page: Math.min(10000, Math.max(1, Math.floor(Number(search.get("page")) || 1))) });
      }
    }
    const stopImpressions = ["/", "/jobs"].includes(pathname)
      ? observeListingImpressions(jobId => track("job_impression", { jobId }, pathname))
      : () => {};
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
      stopImpressions();
      document.removeEventListener("invalid", invalid, true);
      document.removeEventListener("toggle", disclosure, true);
      document.removeEventListener("click", clicked, true);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("submit", submit, true);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", leave);
    };

}

export const IMPRESSION_RATIO = 0.5;
export const IMPRESSION_DURATION_MS = 1000;
type Schedule = (callback: () => void, delay: number) => () => void;

// Keep the visibility clock independent of the DOM so interruption and deduplication are testable.
export function impressionClock(onImpression: (jobId: string) => void, schedule: Schedule = (callback, delay) => {
  const timer = setTimeout(callback, delay);
  return () => clearTimeout(timer);
}) {
  let active = false;
  const visible = new Set<string>(), seen = new Set<string>(), pending = new Map<string, () => void>();
  const cancel = (id: string) => { pending.get(id)?.(); pending.delete(id); };
  const start = (id: string) => {
    if (!active || seen.has(id) || pending.has(id) || !visible.has(id)) return;
    pending.set(id, schedule(() => {
      pending.delete(id);
      if (!active || !visible.has(id) || seen.has(id)) return;
      seen.add(id); onImpression(id);
    }, IMPRESSION_DURATION_MS));
  };
  return {
    visible(id: string, value: boolean) { if (value) { visible.add(id); start(id); } else { visible.delete(id); cancel(id); } },
    active(value: boolean) {
      active = value;
      if (value) visible.forEach(start); else [...pending.keys()].forEach(cancel);
    },
    disconnect() { active = false; [...pending.keys()].forEach(cancel); visible.clear(); },
  };
}

export function observeListingImpressions(onImpression: (jobId: string) => void, doc = document, win = window) {
  if (!win.IntersectionObserver) return () => {};
  const targets = new Map<Element, string>();
  const clock = impressionClock(onImpression);
  const observer = new win.IntersectionObserver(entries => {
    for (const entry of entries) {
      const id = targets.get(entry.target);
      if (id) clock.visible(id, entry.isIntersecting && entry.intersectionRatio >= IMPRESSION_RATIO);
    }
  }, { threshold: [IMPRESSION_RATIO] });
  const refresh = () => {
    for (const [element, id] of targets) if (!element.isConnected) {
      observer.unobserve(element); targets.delete(element); clock.visible(id, false);
    }
    doc.querySelectorAll("[data-analytics-job-id]").forEach(row => {
      const id = row.getAttribute("data-analytics-job-id");
      const target = row.querySelector("summary") || row;
      if (!id || !/^[a-zA-Z0-9_-]{1,100}$/.test(id) || targets.has(target)) return;
      targets.set(target, id); observer.observe(target);
    });
  };
  const activity = () => clock.active(doc.visibilityState === "visible" && doc.hasFocus());
  refresh(); activity();
  const mutations = new win.MutationObserver(refresh);
  mutations.observe(doc.body, { childList: true, subtree: true });
  doc.addEventListener("visibilitychange", activity);
  win.addEventListener("focus", activity); win.addEventListener("blur", activity);
  return () => {
    clock.disconnect(); observer.disconnect(); mutations.disconnect(); targets.clear();
    doc.removeEventListener("visibilitychange", activity);
    win.removeEventListener("focus", activity); win.removeEventListener("blur", activity);
  };
}

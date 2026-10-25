import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import { track, flush, trackingAllowed } from "./client";
let started = false;
export function observeVitals() {
  if (started || !trackingAllowed()) return;
  started = true;
  const report = (metric: Metric) => {
    if (!trackingAllowed() || !Number.isFinite(metric.value)) return;
    track("web_vital", { metric: metric.name, value: Math.round(metric.value * 1000) / 1000, sample: metric.id });
    void flush(document.visibilityState === "hidden");
  };
  onCLS(report); onFCP(report); onINP(report); onLCP(report); onTTFB(report);
}

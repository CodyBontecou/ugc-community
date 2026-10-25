"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CONSENT_KEY } from "@/lib/analytics/browser";
import { observePage } from "@/lib/analytics/observe-page";
import { clearTracking, setTrackingConsent, trackingAllowed } from "@/lib/analytics/client";

export function BehaviorAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<string | null>(null);
  const [signal, setSignal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const update = () => {
      try { setConsent(localStorage.getItem(CONSENT_KEY)); } catch { setConsent("denied"); }
      setAllowed(trackingAllowed());
      setSignal(navigator.doNotTrack === "1" || Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl));
      if (!trackingAllowed()) clearTracking();
    };
    update();
    window.addEventListener("analytics-consent", update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener("analytics-consent", update); window.removeEventListener("storage", update); };
  }, []);
  const choose = (granted: boolean) => { setTrackingConsent(granted); setEditing(false); };
  return <>
    <Suspense fallback={null}><AnalyticsEvents allowed={allowed} /></Suspense>
    {(consent === null || editing) && !signal && <aside aria-label="Analytics preferences" data-analytics-ignore data-editing={editing} className="analytics-consent-prompt fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-warm-gray-200 bg-white p-4 shadow-lg">
      <p className="font-semibold text-warm-gray-900">Help improve ugc.community</p>
      <p className="mt-2 text-sm text-warm-gray-600">Allow anonymous traffic and activity measurement? We track pages and actions, never your form entries. You can change this anytime in <a href="/privacy" className="underline">Privacy</a>.</p>
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => choose(true)} className="rounded-lg bg-warm-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-warm-gray-700 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2">Allow analytics</button><button type="button" onClick={() => choose(false)} className="rounded-lg border border-warm-gray-200 px-3 py-2 text-sm font-semibold hover:bg-warm-gray-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2">No thanks</button></div>
    </aside>}
    {pathname === "/privacy" && <div data-analytics-ignore className="fixed bottom-4 right-4 z-40"><button type="button" onClick={() => setEditing(true)} disabled={signal} title={signal ? "Analytics is disabled by your browser privacy signal" : undefined} className="rounded-lg border border-warm-gray-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-warm-gray-50 focus-visible:outline-2">{signal ? "Analytics disabled by browser" : "Analytics preferences"}</button></div>}
  </>;
}

function AnalyticsEvents({ allowed }: { allowed: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  useEffect(() => {
    if (!allowed) return;
    return observePage(pathname, query);
  }, [allowed, pathname, query]);
  return null;
}

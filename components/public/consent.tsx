export function PublicConsent() {
 return <aside hidden aria-label="Analytics preferences" data-analytics-ignore className="analytics-consent-prompt fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-warm-gray-200 bg-white p-4 shadow-lg">
 <p className="font-semibold text-warm-gray-900">Help improve ugc.community</p><p className="mt-2 text-sm text-warm-gray-600">Allow anonymous traffic and activity measurement? We track pages and actions, never your form entries. You can change this anytime in <a href="/privacy" className="underline">Privacy</a>.</p>
 <div className="mt-4 flex flex-wrap gap-3"><button type="button" data-consent="granted" className="rounded-lg bg-warm-gray-900 px-3 py-2 text-sm font-semibold text-white">Allow analytics</button><button type="button" data-consent="denied" className="rounded-lg border border-warm-gray-200 px-3 py-2 text-sm font-semibold">No thanks</button></div></aside>;
}

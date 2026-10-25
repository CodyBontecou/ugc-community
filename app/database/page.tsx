import type { Metadata } from "next";
import Link from "next/link";
import { Database, LockKeyhole, ArrowRight, ExternalLink } from "lucide-react";
import { Navbar, BackgroundBlobs, Footer } from "@/components/landing";
import { DatabaseRefresh } from "@/components/directory/database-refresh";
import { canAccessCreatorDatabase, creatorBindings } from "@/lib/creator-database/access";
import { parseSearchFilters } from "@/lib/creator-database/filters";
import { searchCreators, type SearchResults } from "@/lib/creator-database/search";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Creator Database — ugc.community", robots: { index: false, follow: false }, alternates: { canonical: "/database" } };

export default async function DatabasePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) if (typeof value === "string") params.set(key, value);
  const filters = parseSearchFilters(params);
  const allowed = await canAccessCreatorDatabase();
  let result: SearchResults | null = null;
  if (allowed) {
    try {
      const { CREATOR_DATABASE } = await creatorBindings();
      result = await searchCreators(CREATOR_DATABASE, filters);
    } catch { /* Show a recoverable state without substituting sample rows. */ }
  }
  function pageUrl(page: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(page));
    return `/database?${next}`;
  }
  return (
    <div className="relative overflow-hidden min-h-screen">
      <BackgroundBlobs /><Navbar />
      <main className="container relative z-[1] pt-36 pb-24">
        <span className="inline-flex items-center gap-2 text-sm text-rose mb-5"><Database size={16} /> Creator database</span>
        <h1 className="text-[clamp(2.5rem,6vw,4rem)] mb-5">Find your next <span className="gradient-text">creator.</span></h1>
        {!allowed ? <div className="max-w-xl bg-white border border-warm-gray-200 rounded-[28px] p-8 my-10">
          <LockKeyhole className="text-rose mb-5" />
          <h2 className="text-3xl mb-4">Private database access</h2>
          <p className="text-warm-gray-600 mb-6">The live database is connected to Subscrape. Access is currently limited to administrators while subscriptions are being prepared.</p>
          <div className="flex flex-wrap gap-4"><Link href="/sign-in?callbackUrl=%2Fdatabase" className="rounded-full px-6 py-3 bg-gradient-to-r from-coral to-rose text-white">Sign in</Link><Link href="/#pricing" className="rounded-full px-6 py-3 border border-warm-gray-200">Join early access</Link></div>
        </div> : !result ? <div role="alert" className="bg-white rounded-[28px] border border-warm-gray-200 p-8 my-10"><h2 className="text-2xl mb-3">The database is temporarily unavailable</h2><p className="text-warm-gray-600">Please try again shortly. Existing uploads will be picked up by the next successful sync.</p></div> : <>
          <DatabaseRefresh />
          <p className="text-warm-gray-600 max-w-3xl mb-6">Real links and contact details shared on r/UGCcreators, grouped by the Reddit author who shared them. Review the source to confirm who each detail belongs to.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-warm-gray-600 mb-8">
            <span>{result.total} matching {result.total === 1 ? "author" : "authors"}</span>
            <span>{result.sync.objects} exports imported</span>
            <span>Checks for uploads every 5 minutes</span>
            <span>Last scan: {result.sync.lastCompletedAt ? new Date(result.sync.lastCompletedAt).toLocaleString("en-US", { timeZone: "UTC" }) + " UTC" : "Waiting for first sync"}</span>
          </div>
          {result.sync.failures > 0 && <p role="status" className="bg-peach-100 border border-peach-200 rounded-xl p-4 mb-6 text-warm-gray-700">{result.sync.failures} exports need another import attempt. Successfully imported data remains available.</p>}
          <form action="/database" className="flex flex-col md:flex-row gap-4 bg-white rounded-[28px] border border-warm-gray-200 p-5 mb-8">
            <label className="flex-1 text-sm font-medium">Search<input name="q" defaultValue={filters.query} placeholder="Username, shared link, or post title" maxLength={100} className="block w-full mt-2 rounded-xl border border-warm-gray-200 px-4 py-3 font-normal" /></label>
            <label className="text-sm font-medium">Platform<select name="platform" defaultValue={filters.platform} className="block w-full mt-2 rounded-xl border border-warm-gray-200 px-4 py-3 bg-white font-normal"><option value="">All platforms</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="youtube">YouTube</option></select></label>
            <label className="flex items-center gap-2 text-sm self-start md:self-center md:mt-6"><input name="email" type="checkbox" value="true" defaultChecked={filters.emailOnly} className="accent-rose" />Has an email</label>
            <button className="self-start md:self-end rounded-full px-6 py-3 bg-gradient-to-r from-coral to-rose text-white inline-flex items-center gap-2">Search<ArrowRight size={16} /></button>
          </form>
          <div className="space-y-5">
            {result.creators.map(creator => <article key={creator.author} className="bg-white rounded-[28px] border border-warm-gray-200 p-5 sm:p-8">
              <div className="flex flex-wrap justify-between gap-4 mb-4">
                <div><h2 className="font-[family-name:var(--font-body)] font-semibold text-xl break-all">u/{creator.author}</h2><p className="text-sm text-warm-gray-600 mt-1">Last captured {creator.lastSeen.slice(0, 10)} · {creator.detailCount} shared details</p></div>
                <div className="flex flex-wrap gap-2 items-start">{[creator.instagram && "Instagram", creator.tiktok && "TikTok", creator.youtube && "YouTube", creator.hasPortfolio && "Portfolio", creator.hasEmail && "Email"].filter(Boolean).map(label => <span key={String(label)} className="px-3 py-1 rounded-full bg-peach-100 text-warm-gray-700 text-xs">{label}</span>)}</div>
              </div>
              <details><summary className="cursor-pointer text-warm-gray-700 underline underline-offset-4">Review links and source evidence</summary>
                <div className="mt-5 grid gap-4 md:grid-cols-2">{creator.details.map((detail, index) => <div key={`${detail.source}-${detail.value}-${index}`} className="min-w-0 bg-warm-gray-50 rounded-2xl p-4 border border-warm-gray-100">
                  <p className="text-xs uppercase tracking-wide text-warm-gray-600 mb-2">{detail.type}{detail.confidence === "candidate" ? " · unconfirmed candidate" : ""}</p>
                  {detail.type === "handle" ? <p className="font-medium break-all">{detail.value}</p> : <a href={detail.type === "email" ? `mailto:${detail.value}` : detail.value} target="_blank" rel="noopener noreferrer nofollow" className="font-medium break-all underline underline-offset-4">{detail.value}</a>}
                  <p className="text-sm text-warm-gray-600 mt-3 break-words">{detail.evidence}</p>
                  <a href={detail.source} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 mt-3 text-xs text-warm-gray-700 underline">Original {detail.title ? "Reddit discussion" : "source"}<ExternalLink size={12} /></a>
                </div>)}</div>
                {creator.detailCount > creator.details.length && <p className="mt-3 text-xs text-warm-gray-600">Showing the 30 most recently captured details.</p>}
              </details>
            </article>)}
            {!result.creators.length && <div className="bg-white rounded-[28px] border border-warm-gray-200 p-10 text-center"><h2 className="text-2xl mb-3">{result.sync.objects ? "No matching records" : "Waiting for the first import"}</h2><p className="text-warm-gray-600 mb-4">{result.sync.objects ? "Try another username or remove a filter." : "The scheduled sync will import available exports automatically."}</p><Link href="/database" className="underline underline-offset-4">Clear filters</Link></div>}
          </div>
          <nav aria-label="Database pagination" className="flex items-center justify-between gap-4 mt-8 text-sm">
            {result.page > 1 ? <Link href={pageUrl(result.page - 1)} className="underline">Previous</Link> : <span />}
            <span>Page {result.page} of {Math.max(1, Math.ceil(result.total / result.pageSize))}</span>
            {result.page * result.pageSize < result.total ? <Link href={pageUrl(result.page + 1)} className="underline">Next</Link> : <span />}
          </nav>
        </>}
      </main><Footer />
    </div>
  );
}

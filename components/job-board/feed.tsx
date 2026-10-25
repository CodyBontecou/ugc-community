import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { boardBindings } from "@/lib/job-board/access";
import { listBoardJobs, type JobFilters } from "@/lib/job-board/search";
import { PAY_LABELS, PAY_TYPES } from "@/lib/job-board/model";
import { JobTable } from "./job-table";

export async function JobFeed({ params = {}, basePath = "/jobs" }: { params?: Record<string, string | string[] | undefined>; basePath?: "/" | "/jobs" }) {
  const one = (name: string) => typeof params[name] === "string" ? params[name] as string : "";
  const filters: JobFilters = {
    q: one("q").trim().slice(0, 100),
    source: ["external", "direct"].includes(one("source")) ? one("source") : "",
    pay: PAY_TYPES.some(type => type === one("pay")) ? one("pay") : "",
    page: Number(one("page")) || 1,
  };
  const activeFilters = [
    ...(filters.q ? [{ key: "q", label: `Search: ${filters.q}` }] : []),
    ...(filters.source ? [{ key: "source", label: filters.source === "direct" ? "Posted directly" : "External opportunities" }] : []),
    ...(filters.pay ? [{ key: "pay", label: PAY_LABELS[filters.pay] }] : []),
  ];
  let result: Awaited<ReturnType<typeof listBoardJobs>> | null = null;
  try { result = await listBoardJobs((await boardBindings()).JOB_BOARD, filters); } catch { /* Show a truthful unavailable state. */ }
  const filterUrl = (remove?: string, page?: number) => {
    const query = new URLSearchParams();
    for (const key of ["q", "source", "pay"] as const) if (filters[key] && key !== remove) query.set(key, filters[key]);
    if (page && page > 1) query.set("page", String(page));
    return `${basePath}${query.size ? `?${query}` : ""}#jobs`;
  };
  const controlClass = "h-11 min-w-0 w-full rounded-xl border border-warm-gray-200 bg-white px-3 text-base sm:text-sm text-warm-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark";

  return (
    <section id="jobs" aria-label="Browse UGC opportunities" className="relative z-[1] scroll-mt-28 pb-20">
      <div className="container max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm" aria-label="Popular job filters">
          <span className="mr-1 hidden sm:inline text-xs text-warm-gray-600">Jump into</span>
          {[
            { label: "All jobs", query: "", active: !activeFilters.length },
            { label: "Guaranteed cash", query: "?pay=cash", active: filters.pay === "cash" && !filters.q && !filters.source },
            { label: "Posted directly", query: "?source=direct", active: filters.source === "direct" && !filters.q && !filters.pay },
          ].map(({ label, query, active }) => (
            <Link key={label} href={`${basePath}${query}#jobs`} aria-current={active ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-full border px-3 py-2 text-xs font-medium ${active ? "border-warm-gray-900 bg-warm-gray-900 text-white" : "border-warm-gray-200 bg-white/80 text-warm-gray-700 hover:bg-peach-100"}`}>
              {label}
            </Link>
          ))}
        </div>
        <div className="overflow-hidden rounded-[24px] border border-warm-gray-200 bg-white/95 shadow-sm">
          <form key={JSON.stringify([filters.q, filters.source, filters.pay])} action={`${basePath}#jobs`} role="search" className="grid grid-cols-2 items-end gap-3 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_180px_210px_auto]">
            <label className="col-span-2 min-w-0 lg:col-span-1">
              <span className="sr-only">Search opportunities</span>
              <span className="relative block"><Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 text-warm-gray-500" /><input type="search" enterKeyHint="search" name="q" defaultValue={filters.q} maxLength={100} placeholder="Search roles, brands, keywords…" className={`${controlClass} pl-10`} /></span>
            </label>
            <label className="relative min-w-0">
              <span className="sr-only">Source</span>
              <select name="source" defaultValue={filters.source} className={`${controlClass} appearance-none pr-10 forced-colors:appearance-auto`}>
                <option value="">All sources</option><option value="external">External opportunity</option><option value="direct">Posted directly</option>
              </select>
              <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-gray-600 forced-colors:hidden" />
            </label>
            <label className="relative min-w-0">
              <span className="sr-only">Compensation</span>
              <select name="pay" defaultValue={filters.pay} className={`${controlClass} appearance-none pr-10 forced-colors:appearance-auto`}>
                <option value="">All pay types</option>{PAY_TYPES.map(type => <option key={type} value={type}>{PAY_LABELS[type]}</option>)}
              </select>
              <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-gray-600 forced-colors:hidden" />
            </label>
            <button className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-coral to-rose px-5 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark lg:col-span-1"><SlidersHorizontal size={15} aria-hidden="true" />Search jobs</button>
          </form>
          {activeFilters.length > 0 && <div className="flex flex-wrap items-center gap-2 px-4 pb-4 sm:px-5">{activeFilters.map(filter => <Link key={filter.key} href={filterUrl(filter.key)} aria-label={`Remove ${filter.label} filter`} className="inline-flex max-w-full items-center gap-2 rounded-full bg-peach-100 px-3 py-1.5 text-xs text-warm-gray-700 hover:bg-peach-200"><span className="truncate">{filter.label}</span><X size={12} aria-hidden="true" className="shrink-0" /></Link>)}<Link href={`${basePath}#jobs`} className="px-2 py-1 text-xs text-warm-gray-600 underline underline-offset-4">Clear all</Link></div>}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-warm-gray-200 px-4 py-3 text-xs text-warm-gray-600 sm:px-6">
            <p>{result ? <><span className="font-semibold tabular-nums text-warm-gray-900">{result.total}</span> {result.total === 1 ? "opportunity" : "opportunities"}{activeFilters.length > 0 ? " found" : " to explore"}</> : "UGC opportunities"}</p>
            <span>Newest first</span>
          </div>
          {!result ? <div role="alert" className="border-t border-warm-gray-200 px-6 py-14 text-center"><h2 className="mb-3 text-3xl">Jobs are temporarily unavailable</h2><p className="text-sm text-warm-gray-600">Please try again shortly.</p></div> : !result.jobs.length ? <div className="border-t border-warm-gray-200 px-6 py-14 text-center">
            <h2 className="mb-3 text-3xl">{activeFilters.length ? "No matching opportunities" : "New opportunities are on the way"}</h2>
            <p className="mx-auto mb-6 max-w-md text-sm text-warm-gray-600">{activeFilters.length ? "Try another keyword or clear your filters." : "We’re reviewing the first briefs. Hiring a UGC creator? Post your role for free."}</p>
            <Link href={activeFilters.length ? `${basePath}#jobs` : "/post-job"} className="inline-flex rounded-full border border-warm-gray-200 px-5 py-2.5 text-sm font-medium hover:bg-peach-100">{activeFilters.length ? "Clear filters" : "Post a free job"}</Link>
          </div> : <JobTable jobs={result.jobs} />}
          {result && result.total > result.pageSize && <nav aria-label="Job pagination" className="flex items-center justify-between border-t border-warm-gray-200 px-4 py-4 text-xs sm:px-6">
            {result.page > 1 ? <Link href={filterUrl(undefined, result.page - 1)} className="inline-flex items-center gap-2 rounded-lg p-2 hover:bg-peach-100"><ArrowLeft size={14} />Previous</Link> : <span />}
            <span className="tabular-nums text-warm-gray-600">Page {result.page} of {Math.ceil(result.total / result.pageSize)}</span>
            {result.page * result.pageSize < result.total ? <Link href={filterUrl(undefined, result.page + 1)} className="inline-flex items-center gap-2 rounded-lg p-2 hover:bg-peach-100">Next<ArrowRight size={14} /></Link> : <span />}
          </nav>}
        </div>
        <p className="mt-4 text-center text-sm"><Link href="/apply-profile" className="text-rose underline">Create your quick-apply profile</Link></p>
        <p className="mt-4 text-center text-xs text-warm-gray-600">Free to browse · Reviewed before publication · Quick apply by email where accepted</p>
      </div>
    </section>
  );
}

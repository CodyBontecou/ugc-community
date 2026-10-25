import Link from "next/link";
import { boardBindings } from "@/lib/job-board/access";
import { listBoardJobs, type JobFilters } from "@/lib/job-board/search";
import { PAY_LABELS, PAY_TYPES } from "@/lib/job-board/model";
import { JobCard } from "./job-card";

export async function JobFeed({ params = {} }: { params?: Record<string, string | string[] | undefined> }) {
  const one = (name: string) => typeof params[name] === "string" ? params[name] as string : "";
  const filters: JobFilters = { q: one("q").slice(0, 100), source: one("source"), pay: one("pay"), page: Number(one("page")) || 1 };
  let result: Awaited<ReturnType<typeof listBoardJobs>> | null = null;
  try { result = await listBoardJobs((await boardBindings()).JOB_BOARD, filters); } catch { /* Show a truthful unavailable state. */ }
  const pageUrl = (page: number) => `/jobs?${new URLSearchParams({ q: filters.q, source: filters.source, pay: filters.pay, page: String(page) })}`;
  return <section id="jobs" className="relative z-[1] scroll-mt-28 pb-20">
    <div className="container max-w-5xl">
      <form action="/jobs" className="bg-white border border-warm-gray-200 rounded-[28px] p-5 flex flex-col md:flex-row gap-4 mb-7">
        <label className="flex-1 text-sm font-medium">Search opportunities<input name="q" defaultValue={filters.q} maxLength={100} placeholder="Brand, role, or keyword" className="block w-full border border-warm-gray-200 rounded-xl mt-2 px-4 py-3" /></label>
        <label className="text-sm font-medium">Source<select name="source" defaultValue={filters.source} className="block w-full border border-warm-gray-200 bg-white rounded-xl mt-2 px-4 py-3"><option value="">All sources</option><option value="external">External opportunity</option><option value="direct">Posted directly</option></select></label>
        <label className="text-sm font-medium">Compensation<select name="pay" defaultValue={filters.pay} className="block w-full border border-warm-gray-200 bg-white rounded-xl mt-2 px-4 py-3"><option value="">All compensation</option>{PAY_TYPES.map(type => <option key={type} value={type}>{PAY_LABELS[type]}</option>)}</select></label>
        <button className="self-start md:self-end bg-gradient-to-r from-coral to-rose text-white rounded-full px-6 py-3 font-medium">Search</button>
      </form>
      <p className="text-sm text-warm-gray-600 mb-6">Free to browse · Reviewed before publication · Applications go to the original destination</p>
      {!result ? <div role="alert" className="bg-white rounded-[28px] border border-warm-gray-200 p-10 text-center"><h2 className="text-3xl mb-3">The feed is temporarily unavailable</h2><p className="text-warm-gray-600">Please try again shortly.</p></div> : !result.jobs.length ? <div className="bg-white rounded-[28px] border border-warm-gray-200 p-10 sm:p-14 text-center">
        <h2 className="text-3xl mb-4">{filters.q || filters.source || filters.pay ? "No opportunities match yet" : "Our first opportunities are under review"}</h2>
        <p className="text-warm-gray-600 max-w-lg mx-auto mb-6">{filters.q || filters.source || filters.pay ? "Try a different search or clear the filters." : "We’re checking original briefs, compensation, and freshness before adding jobs to the feed. Have a role for a UGC creator? Submit it for free."}</p>
        <div className="flex flex-wrap justify-center gap-4"><Link href="/post-job" className="bg-gradient-to-r from-coral to-rose text-white rounded-full px-6 py-3">Submit a job for free</Link>{(filters.q || filters.source || filters.pay) && <Link href="/jobs" className="rounded-full border border-warm-gray-200 px-6 py-3">Clear filters</Link>}</div>
      </div> : <><p className="text-sm text-warm-gray-600 mb-5">{result.total} {result.total === 1 ? "opportunity" : "opportunities"}</p><div className="space-y-6">{result.jobs.map(job => <JobCard key={job.id} job={job} />)}</div>
        <nav aria-label="Job pagination" className="flex justify-between items-center text-sm mt-8">{result.page > 1 ? <Link href={pageUrl(result.page - 1)} className="underline">Previous</Link> : <span />}<span>Page {result.page} of {Math.ceil(result.total / result.pageSize)}</span>{result.page * result.pageSize < result.total ? <Link href={pageUrl(result.page + 1)} className="underline">Next</Link> : <span />}</nav></>}
    </div>
  </section>;
}

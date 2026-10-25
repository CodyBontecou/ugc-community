import { redirect } from "next/navigation";
import { boardAdmin, boardBindings } from "@/lib/job-board/access";
import { supplyReport } from "@/lib/job-board/search";
import type { BoardJob } from "@/lib/job-board/model";
import { ReviewForm } from "@/components/job-board/review-form";
export const dynamic = "force-dynamic";
export default async function OpportunityReviewPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!await boardAdmin()) redirect("/sign-in");
  try {
    const db = (await boardBindings()).JOB_BOARD;
    const report = await supplyReport(db);
    const page = Math.max(1, Math.floor(Number((await searchParams).page) || 1));
    const rows = await db.prepare(`SELECT * FROM board_jobs ORDER BY CASE status WHEN 'pending_review' THEN 0 WHEN 'published' THEN 1 ELSE 2 END, updated_at DESC LIMIT 20 OFFSET ?`).bind((page - 1) * 20).all<BoardJob>();
    const total = (await db.prepare("SELECT COUNT(*) AS count FROM board_jobs").first<{ count: number }>())?.count || 0;
    return <div className="space-y-8">
      <div><h2 className="text-3xl mb-3">Job supply validation & review</h2><p className="text-warm-gray-600">Two-week observation: {new Date(report.window.starts_at).toLocaleString("en-US", { timeZone: "America/Puerto_Rico", dateStyle: "medium", timeStyle: "short" })} to {new Date(report.window.ends_at).toLocaleString("en-US", { timeZone: "America/Puerto_Rico", dateStyle: "medium", timeStyle: "short" })} (Puerto Rico time). {new Date() < new Date(report.window.ends_at) ? "Collection in progress." : "Observation window complete."}</p><p className="text-sm text-warm-gray-600 mt-2">Last import: {String(report.stats?.lastSync || "Not yet run")}</p></div>
      <div className="grid sm:grid-cols-3 gap-4">{[["New qualifying cash jobs", report.qualifying], ["External candidates", report.stats?.candidates], ["Awaiting review", report.stats?.pending], ["Archived sources", report.stats?.sources], ["Sources with full text", report.stats?.fullText], ["Sources with original dates", report.stats?.originalDates]].map(([label, value]) => <div key={String(label)} className="p-5 rounded-2xl bg-white border border-warm-gray-200"><p className="text-3xl font-medium mb-2">{value || 0}</p><p className="text-sm text-warm-gray-600">{label}</p></div>)}</div>
      <p className="text-sm text-warm-gray-600">A qualifying job needs a unique campaign, full original brief, source posting date within the window, explicit guaranteed cash, a confirmed application destination, and manual freshness review. Old excerpt-only audit leads are not counted. Counts persist when a job closes; rejected qualifications are excluded.</p>
      <div className="rounded-2xl bg-white border border-warm-gray-200 p-6"><h3 className="text-2xl mb-3">Daily qualifying supply</h3>{report.daily.length ? <table className="w-full text-sm"><thead><tr><th className="text-left py-2">First observed (Puerto Rico)</th><th className="text-right">Unique campaigns</th></tr></thead><tbody>{report.daily.map(day => <tr key={day.day}><td className="py-2">{day.day}</td><td className="text-right">{day.jobs}</td></tr>)}</tbody></table> : <p className="text-warm-gray-600 text-sm">No jobs have met the qualification criteria yet.</p>}</div>
      {Number(report.stats?.errors) > 0 && <p role="alert" className="text-red-700">{report.stats?.errors} export imports need attention.</p>}
      <a href="/api/job-board/supply" className="inline-block text-sm underline underline-offset-4">Download supply report (JSON)</a>
      <h3 className="text-3xl">Review queue & listings</h3>
      {rows.results.map(job => <article key={job.id} className="rounded-[28px] border border-warm-gray-200 bg-white p-6"><div className="flex flex-wrap gap-3 text-xs text-warm-gray-600 mb-3"><span>{job.source_kind === "external" ? "External opportunity" : "Posted directly"}</span><span>{job.status}</span><span>Original date: {job.source_published_at || "Not captured"}</span></div><h4 className="text-2xl mb-3">{job.company}: {job.title}</h4>{job.source_url && <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="underline text-sm">Review original source</a>}{job.source_kind === "direct" && <p className="text-sm text-warm-gray-600 mt-3">Private submission contact: {job.submitter_email || "Not provided"}. Contact ownership is not automatically verified.</p>}<SourceText sourceKey={job.source_key} /><details className="mt-4"><summary className="cursor-pointer font-medium">Review and edit listing</summary><ReviewForm job={job} /></details></article>)}
      <nav className="flex justify-between text-sm" aria-label="Review pagination">{page > 1 ? <a href={`?page=${page - 1}`} className="underline">Previous</a> : <span />}{page * 20 < total && <a href={`?page=${page + 1}`} className="underline">Next</a>}</nav>
    </div>;
  } catch { return <p role="alert" className="p-6 bg-white rounded-2xl">The review queue is temporarily unavailable. Check the job-board binding and migrations.</p>; }
}
async function SourceText({ sourceKey }: { sourceKey: string | null }) {
  if (!sourceKey) return null;
  const db = (await boardBindings()).JOB_BOARD;
  const source = await db.prepare("SELECT full_text, captured_at FROM board_sources WHERE source_key=?").bind(sourceKey).first<{ full_text: string; captured_at: string }>();
  return source ? <details className="mt-3 text-sm"><summary className="cursor-pointer">Captured full text · {source.captured_at.slice(0, 10)}</summary><pre className="whitespace-pre-wrap break-words bg-warm-gray-50 rounded-xl p-4 mt-3 max-h-96 overflow-auto font-sans">{source.full_text}</pre></details> : <p className="text-sm text-warm-gray-600 mt-3">Audit excerpt only. Full text and original posting date still required.</p>;
}

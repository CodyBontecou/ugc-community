import { ExternalLink, CalendarDays } from "lucide-react";
import { PAY_LABELS, safeLink, type BoardJob } from "@/lib/job-board/model";

export function JobCard({ job }: { job: BoardJob }) {
  return <article className="bg-white border border-warm-gray-200 rounded-[28px] p-6 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <span className={`text-xs font-medium rounded-full px-3 py-1.5 ${job.source_kind === "external" ? "bg-peach-100 text-warm-gray-700" : "bg-lavender-soft/30 text-purple-dark"}`}>{job.source_kind === "external" ? "External opportunity" : "Posted directly"}</span>
      <span className="text-xs text-warm-gray-600">{PAY_LABELS[job.compensation_type]}</span>
    </div>
    <p className="text-sm text-warm-gray-600 mb-2 break-words">{job.company}</p>
    <h2 className="text-3xl mb-4 break-words">{job.title}</h2>
    <p className="text-warm-gray-600 whitespace-pre-line break-words mb-5">{job.description}</p>
    <p className="font-medium text-warm-gray-900 mb-5 break-words">{job.compensation_text}</p>
    <dl className="grid sm:grid-cols-2 gap-4 text-sm mb-6">{[["Deliverables", job.deliverables], ["Eligibility", job.eligibility], ["Usage rights", job.usage_rights]].map(([label, value]) => <div key={label}><dt className="font-medium text-warm-gray-900 mb-1">{label}</dt><dd className="text-warm-gray-600 whitespace-pre-line break-words">{value || "Not stated in the source"}</dd></div>)}</dl>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-warm-gray-600 mb-6">
      <span className="inline-flex items-center gap-1"><CalendarDays size={14} />{job.closing_at ? `Closes ${job.closing_at.slice(0, 10)} (UTC)` : "Closing date not stated"}</span>
      <span>{job.source_kind === "external" ? `Originally posted ${job.source_published_at?.slice(0, 10) || "Unknown"}` : `Posted ${job.published_at?.slice(0, 10)}`}</span>
      <span>Reviewed {job.verified_at?.slice(0, 10)}</span>
    </div>
    <div className="flex flex-wrap items-center gap-5">
      {job.email_apply_enabled ? <a href={`/jobs/${job.id}/apply`} className="inline-flex items-center gap-2 bg-gradient-to-r from-coral to-rose text-white rounded-full py-3 px-6 font-medium">Quick apply by email</a> : safeLink(job.application_url) && <a href={job.application_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2 bg-gradient-to-r from-coral to-rose text-white rounded-full py-3 px-6 font-medium">Apply at original destination<ExternalLink size={15} /></a>}
      {job.source_url && safeLink(job.source_url) && <a href={job.source_url} target="_blank" rel="noopener noreferrer nofollow" className="text-sm text-warm-gray-600 underline underline-offset-4">View original source</a>}
    </div>
  </article>;
}

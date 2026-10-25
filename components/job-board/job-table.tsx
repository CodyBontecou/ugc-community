import { ChevronDown, ExternalLink } from "lucide-react";
import { PAY_LABELS, safeLink } from "@/lib/job-board/display";
import type { BoardJob } from "@/lib/job-board/model";
import { compensationSummary } from "@/lib/job-board/presentation";
import { JobCard } from "./job-card";

function postedDate(job: BoardJob) {
  const value = job.source_kind === "external" ? job.source_published_at : job.published_at;
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return { value, label: new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value)) };
}

export function JobTable({ jobs }: { jobs: BoardJob[] }) {
  const columns = "lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1fr)_80px_144px] lg:gap-4";

  return (
    <div>
      <div aria-hidden="true" className={`hidden border-y border-warm-gray-200 bg-warm-gray-50/80 px-6 py-3 text-xs text-warm-gray-600 ${columns}`}>
        <span>Role / Company</span><span>Compensation</span><span>Source</span><span>Posted</span><span>Apply</span>
      </div>
      <ul aria-label="UGC opportunities, newest first" className="divide-y divide-warm-gray-200">
        {jobs.map(job => {
          const date = postedDate(job);
          const applicationUrl = safeLink(job.application_url);
          return (
            <li key={job.id} className="relative" data-analytics-job-id={job.id}>
              <details name="job-briefs" className="group peer open:bg-peach-100/70">
                <summary className={`block cursor-pointer list-none space-y-3 p-4 hover:bg-peach-100/50 sm:p-6 lg:space-y-0 [&::-webkit-details-marker]:hidden ${columns}`}>
                  <span className="block min-w-0">
                    <span role="heading" aria-level={2} className="block break-words text-base font-semibold leading-6 text-warm-gray-900">{job.title}</span>
                    <span className="mt-1 block break-words text-sm text-warm-gray-600">{job.company}</span>
                  </span>
                  <span className="block min-w-0">
                    <span className="line-clamp-2 break-words text-base font-semibold text-warm-gray-900">{compensationSummary(job.compensation_text, job.compensation_type)}</span>
                    <span className="mt-1 block text-xs text-warm-gray-600">{PAY_LABELS[job.compensation_type]}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-3 lg:block">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${job.source_kind === "direct" ? "bg-lavender-soft/25 text-purple-dark" : "bg-peach-200/70 text-warm-gray-700"}`}>
                      {job.source_kind === "direct" ? "Posted directly" : "External opportunity"}
                    </span>
                    {date && <time dateTime={date.value} className="text-xs text-warm-gray-600 lg:hidden">Posted {date.label}</time>}
                  </span>
                  <span className="hidden text-xs text-warm-gray-600 lg:block">
                    {date ? <time dateTime={date.value} title={`${date.value.slice(0, 10)} (UTC)`}>{date.label}</time> : "Not stated"}
                  </span>
                  <span className="flex items-center justify-end lg:flex-col lg:items-stretch lg:justify-start lg:pt-14">

                    <span className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-warm-gray-700">
                      <span className="group-open:hidden">View brief</span><span className="hidden group-open:inline">Hide brief</span><ChevronDown size={14} aria-hidden="true" className="group-open:rotate-180" />
                    </span>
                  </span>
                </summary>
                <div className="px-3 pb-4 sm:px-6 sm:pb-6"><JobCard job={job} /></div>
              </details>
              <div className="relative -mt-[calc(2.75rem+1rem)] w-fit px-4 pb-4 peer-open:mt-0 sm:-mt-[calc(2.75rem+1.5rem)] sm:px-6 sm:pb-6 lg:absolute lg:right-6 lg:top-6 lg:mt-0 lg:w-36 lg:p-0 [&>a]:w-full">
                {job.email_apply_enabled ? (
                      <a href={`/jobs/${job.id}/apply`} aria-label={`Quick apply by email for ${job.title} at ${job.company}`} className="primary-action inline-flex min-h-11 items-center justify-center rounded-full px-3 py-2 text-sm font-semibold">Apply by email</a>
                    ) : applicationUrl && (
                      <a href={applicationUrl} target="_blank" rel="noopener noreferrer nofollow" aria-label={`Apply for ${job.title} at ${job.company} (opens in a new tab)`} className="primary-action inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold">Apply<ExternalLink size={14} aria-hidden="true" /></a>
                    )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

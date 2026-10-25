"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { PAY_LABELS, safeLink, type BoardJob } from "@/lib/job-board/model";
import { JobCard } from "./job-card";

function postedDate(job: BoardJob) {
  const value = job.source_kind === "external" ? job.source_published_at : job.published_at;
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return { value, label: new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value)) };
}

export function JobTable({ jobs }: { jobs: BoardJob[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <table className="w-full table-fixed text-left text-sm">
      <caption className="sr-only">UGC opportunities, newest first. Expand a role to read the full brief.</caption>
      <thead className="border-y border-warm-gray-200 bg-warm-gray-50/80 text-xs text-warm-gray-600">
        <tr>
          <th scope="col" className="w-[48%] px-4 py-3 font-medium sm:w-[42%] sm:px-6">Role / Company</th>
          <th scope="col" className="px-2 py-3 font-medium sm:w-[24%] sm:px-4">Compensation</th>
          <th scope="col" className="hidden w-[16%] px-4 py-3 font-medium lg:table-cell">Source</th>
          <th scope="col" className="hidden w-[11%] px-4 py-3 font-medium md:table-cell">Posted</th>
          <th scope="col" className="w-12 px-2 py-3 sm:w-24 sm:px-4"><span className="sr-only">Apply</span></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-warm-gray-200">
        {jobs.map((job) => {
          const open = expanded === job.id;
          const date = postedDate(job);
          const applicationUrl = safeLink(job.application_url);
          const detailsId = `job-details-${job.id}`;
          return (
            <Fragment key={job.id}>
              <tr className={open ? "bg-peach-100/70" : "hover:bg-peach-100/50"}>
                <th scope="row" className="px-4 py-4 font-normal align-top sm:px-6 sm:py-5">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={detailsId}
                    onClick={() => setExpanded(open ? null : job.id)}
                    className="group flex w-full items-start gap-2 text-left rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-dark"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block break-words font-semibold leading-snug text-warm-gray-900 group-hover:text-purple-dark">{job.title}</span>
                      <span className="mt-1 block break-words text-xs text-warm-gray-600 sm:text-sm">{job.company}</span>
                      <span className="mt-1.5 block text-[11px] text-warm-gray-600 lg:hidden">{job.source_kind === "direct" ? "Posted directly" : "External opportunity"}</span>
                    </span>
                    <ChevronDown size={15} aria-hidden="true" className={`mt-0.5 shrink-0 text-warm-gray-500 ${open ? "rotate-180" : ""}`} />
                  </button>
                </th>
                <td className="px-2 py-4 align-top sm:px-4 sm:py-5">
                  <span className="block line-clamp-2 break-words font-medium text-warm-gray-900" title={job.compensation_text}>{job.compensation_text || PAY_LABELS[job.compensation_type]}</span>
                  <span className="mt-1 block text-xs text-warm-gray-600">{PAY_LABELS[job.compensation_type]}</span>
                </td>
                <td className="hidden px-4 py-5 align-top lg:table-cell">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${job.source_kind === "direct" ? "bg-lavender-soft/25 text-purple-dark" : "bg-peach-200/70 text-warm-gray-700"}`}>
                    {job.source_kind === "direct" ? "Posted directly" : "External"}
                  </span>
                </td>
                <td className="hidden px-4 py-5 align-top text-xs text-warm-gray-600 md:table-cell">
                  {date ? <time dateTime={date.value} title={`${date.value.slice(0, 10)} (UTC)`}>{date.label}</time> : "Not stated"}
                </td>
                <td className="px-2 py-4 text-right align-top sm:px-4 sm:py-5">
                  {job.email_apply_enabled ? <a href={`/jobs/${job.id}/apply`} aria-label={`Quick apply by email for ${job.title} at ${job.company}`} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full bg-gradient-to-r from-coral to-rose px-2 text-xs font-medium text-white sm:px-3">Apply<span className="sr-only"> by email</span></a> : applicationUrl && <a href={applicationUrl} target="_blank" rel="noopener noreferrer nofollow" aria-label={`Apply for ${job.title} at ${job.company} (opens in a new tab)`} className="inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-full border border-warm-gray-200 bg-white px-2 text-xs font-medium text-warm-gray-700 hover:border-coral hover:bg-peach-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark sm:px-3"><span className="hidden sm:inline">Apply</span><ExternalLink size={13} aria-hidden="true" /></a>}
                </td>
              </tr>
              <tr hidden={!open} id={detailsId}>
                <td colSpan={5} className="bg-warm-gray-50/60 p-3 sm:p-5"><JobCard job={job} /></td>
              </tr>
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import { applicationStatusLabel, type ApplicationHistoryEntry } from "@/lib/job-board/application-history";

export function ApplicationHistory({ applications }: { applications: ApplicationHistoryEntry[] | null }) {
  return (
    <section id="applications" aria-labelledby="applications-heading" className="scroll-mt-24 rounded-[28px] border border-warm-gray-200 bg-white p-5 sm:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="applications-heading" className="text-2xl sm:text-3xl">Your applications</h2>
        <Link href="/jobs" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-rose">Browse jobs<ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>
      <p className="mb-5 text-sm text-warm-gray-600">Applications sent by email through ugc.community appear here. Applications made on external sites are managed by the employer.</p>
      {applications === null ? <p role="alert" className="text-sm text-warm-gray-600">Application history is temporarily unavailable. Please try again shortly.</p> : applications.length === 0 ? (
        <div className="rounded-2xl bg-warm-gray-50 px-5 py-8 text-center">
          <BriefcaseBusiness size={28} aria-hidden="true" className="mx-auto mb-3 text-rose" />
          <h3 className="mb-2 text-xl">Find your next opportunity</h3>
          <p className="mx-auto max-w-md text-sm text-warm-gray-600">You haven’t submitted an email application yet. Browse the job board and apply when you find a brief that fits.</p>
        </div>
      ) : <>
        <ul className="divide-y divide-warm-gray-100">{applications.map(application => (
          <li key={application.id} className="py-4 first:pt-0 last:pb-0 [overflow-wrap:anywhere]">
            <Link href={`/jobs/${application.job_id}/apply`} className="inline-flex min-h-11 items-center gap-2 font-medium text-warm-gray-900 underline underline-offset-4">{application.job_title}<ArrowUpRight size={16} aria-hidden="true" className="shrink-0" /></Link>
            <p className="mt-1 text-sm text-warm-gray-600">{application.company}</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-warm-gray-600"><time dateTime={application.created_at}>{application.created_at.slice(0, 10)}</time><span>{applicationStatusLabel(application)}</span></div>
          </li>
        ))}</ul>
        {applications.length === 50 && <p className="mt-5 text-xs text-warm-gray-500">Showing your 50 most recent applications.</p>}
      </>}
    </section>
  );
}

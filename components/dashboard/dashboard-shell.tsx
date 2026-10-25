import Link from "next/link";
import { ArrowRight, Search, UserRound } from "lucide-react";
import { ApplicationHistory } from "@/components/job-board/application-history";
import type { ApplicationHistoryEntry } from "@/lib/job-board/application-history";

export function DashboardShell({ userName, profileSaved, profileShareId, applications }: {
  userName: string;
  profileSaved: boolean | null;
  profileShareId?: string;
  applications: ApplicationHistoryEntry[] | null;
}) {
  const firstName = userName.trim().split(/\s+/)[0] || "Creator";
  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-warm-gray-500">Your job search</p>
          <h1 className="break-words text-3xl sm:text-4xl">Hey {firstName}!</h1>
          <p className="mt-2 text-warm-gray-600">Find your next brief and keep your applications in one place.</p>
        </div>
        <Link href="/jobs" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-coral to-rose px-6 py-3 font-medium text-white"><Search size={18} aria-hidden="true" />Browse jobs</Link>
      </div>

      <section aria-labelledby="profile-heading" className="rounded-[28px] border border-warm-gray-200 bg-white p-5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-peach-100 text-rose"><UserRound size={22} aria-hidden="true" /></div>
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-warm-gray-500">Quick apply</p>
            <h2 id="profile-heading" className="mb-2 text-2xl sm:text-3xl">{profileSaved === null ? "Your creator profile" : profileSaved ? "Your profile is ready" : "Create your creator profile"}</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-warm-gray-600">{profileSaved === null ? "Your profile status is temporarily unavailable. Open your profile to try again." : profileSaved ? "Keep your work links and creator details up to date for your next email application." : "Add your details and work links once, then reuse them for jobs that accept applications by email."}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/apply-profile" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-warm-gray-200 px-5 py-2 text-sm font-medium text-warm-gray-700 hover:bg-peach-100">{profileSaved === null ? "Open profile" : profileSaved ? "Edit profile" : "Set up profile"}<ArrowRight size={16} aria-hidden="true" /></Link>
              {profileShareId && <Link href={`/creator-profile/${profileShareId}`} className="inline-flex min-h-11 items-center justify-center px-3 text-sm text-rose underline underline-offset-4">View shareable profile</Link>}
            </div>
          </div>
        </div>
      </section>

      <ApplicationHistory applications={applications} />
      <p className="text-center text-sm text-warm-gray-600">Hiring a creator? <Link href="/post-job" className="inline-flex min-h-11 items-center text-rose underline underline-offset-4">Post a job for free</Link></p>
    </div>
  );
}

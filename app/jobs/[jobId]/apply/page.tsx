import { redirect, notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { applicantSession } from "@/lib/job-board/applicant-access";
import { boardBindings } from "@/lib/job-board/access";
import { getCreatorProfile } from "@/lib/job-board/profiles";
import { VISIBLE, visibleBindings } from "@/lib/job-board/search";
import type { BoardJob } from "@/lib/job-board/model";
import type { Application } from "@/lib/job-board/applications";
import { ApplicationForm } from "@/components/job-board/application-form";
import { Navbar, Footer } from "@/components/landing";
export const dynamic = "force-dynamic";
export const metadata = { title: "Apply for a UGC job — ugc.community", robots: { index: false, follow: false } };
export default async function ApplyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(jobId)) notFound();
  if (!await getServerSession()) redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/jobs/${jobId}/apply`)}`);
  const user = await applicantSession();
  const db = (await boardBindings()).JOB_BOARD;
  const job = await db.prepare(`SELECT * FROM board_jobs WHERE id=? AND ${VISIBLE}`).bind(jobId, ...visibleBindings(new Date().toISOString())).first<BoardJob>();
  const existing = await db.prepare("SELECT * FROM board_applications WHERE job_id=? AND user_id=?").bind(jobId, user.id).first<Application>();
  if (!job && !existing) notFound();
  if (job && !job.application_email && !existing) redirect(job.application_url);
  const saved = await getCreatorProfile(db, user.id);
  return <><Navbar /><main className="container max-w-3xl pt-36 pb-20 space-y-6"><a href="/jobs" className="text-sm underline">Back to opportunities</a><h1 className="text-4xl">{job?.title || existing?.job_title}</h1><p className="text-warm-gray-600 whitespace-pre-line">{job?.description}</p>{job && <div className="bg-white border border-warm-gray-200 rounded-2xl p-5 text-sm space-y-3"><p><strong>Deliverables:</strong> {job.deliverables || "Not stated"}</p><p><strong>Eligibility:</strong> {job.eligibility || "Not stated"}</p><p><strong>Usage rights:</strong> {job.usage_rights || "Not stated"}</p></div>}
    {!job && existing?.status !== "sent" ? <p role="alert">This job is no longer open for applications. Your previous send status is {existing?.status}. Contact support if you need help confirming it.</p> : !saved && !existing ? <div className="bg-white border border-warm-gray-200 rounded-[28px] p-8 space-y-4"><h2 className="text-2xl">First, create your quick-apply profile</h2><p>Save your socials and work samples once. Then return here to add a short note and send your application.</p><a href={`/apply-profile?job=${jobId}`} className="inline-block rounded-full bg-gradient-to-r from-coral to-rose text-white px-6 py-3">Generate my creator profile</a></div> : <ApplicationForm jobId={jobId} company={existing?.company || job!.company} recipient={existing?.recipient || job!.application_email!} email={existing?.reply_email || user.email} profile={existing ? JSON.parse(existing.profile_json) : saved!.profile} existing={existing ? { status: existing.status, message: existing.message } : null} />}
  </main><Footer /></>;
}

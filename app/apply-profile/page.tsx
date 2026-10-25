import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { applicantSession } from "@/lib/job-board/applicant-access";
import { boardBindings } from "@/lib/job-board/access";
import { getCreatorProfile, type CreatorProfile } from "@/lib/job-board/profiles";
import { ProfileEditor } from "@/components/job-board/profile-editor";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Navbar, Footer } from "@/components/landing";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your quick-apply profile — ugc.community", robots: { index: false, follow: false } };
export default async function ApplyProfilePage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const session = await getServerSession();
  if (!session) redirect("/sign-in?callbackUrl=/apply-profile");
  const user = await applicantSession();
  const job = (await searchParams).job;
  const board = (await boardBindings()).JOB_BOARD;
  const saved = await getCreatorProfile(board, user.id);
  const account = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  const handleUrl = (base: string, handles: string[] | null | undefined) => handles?.[0] ? `${base}${encodeURIComponent(handles[0].replace(/^@/, ""))}` : "";
  const initial: CreatorProfile = saved?.profile || {
    name: account?.displayName || account?.name || "", headline: account?.tagline || "", bio: account?.bio || "",
    location: [account?.locationCity, account?.locationCountry].filter(Boolean).join(", "), niches: account?.niches?.join(", ") || "", availability: "",
    instagram: handleUrl("https://www.instagram.com/", account?.instagramHandles),
    tiktok: handleUrl("https://www.tiktok.com/@", account?.tiktokHandles),
    youtube: handleUrl("https://www.youtube.com/@", account?.youtubeHandles), portfolio: account?.websiteUrl || "",
  };
  const history = await board.prepare("SELECT id, job_id, job_title, company, status, created_at FROM board_applications WHERE user_id=? ORDER BY created_at DESC LIMIT 50")
    .bind(user.id).all<{ id: string; job_id: string; job_title: string; company: string; status: string; created_at: string }>();
  return <><Navbar /><main className="container max-w-5xl pt-36 pb-20 space-y-8"><div><h1 className="text-4xl mb-4">Create once. Apply with confidence.</h1><p className="text-warm-gray-600">Generate a reusable creator profile and bring your work to your next opportunity.</p></div>
    {job && /^[a-zA-Z0-9-]+$/.test(job) && <a href={`/jobs/${job}/apply`} className="inline-block text-rose underline">Return to your application after saving</a>}
    <ProfileEditor initial={initial} initialShareId={saved?.shareId} />
    <section className="space-y-4"><h2 className="text-3xl">Your applications</h2>{!history.results.length ? <p className="text-warm-gray-600">Your submitted applications will appear here.</p> : <ul className="space-y-3">{history.results.map(application => <li key={application.id} className="bg-white rounded-2xl border border-warm-gray-200 p-5"><a className="font-medium underline" href={`/jobs/${application.job_id}/apply`}>{application.job_title} · {application.company}</a><p className="text-sm mt-2">{application.created_at.slice(0, 10)} · {application.status === "sent" ? "Sent to email provider" : application.status === "failed" ? "Send unconfirmed — open to retry" : "Awaiting send confirmation"}</p></li>)}</ul>}</section>
  </main><Footer /></>;
}

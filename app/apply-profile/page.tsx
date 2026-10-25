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
  return <><Navbar /><main className="container max-w-5xl pt-28 sm:pt-36 pb-20 space-y-8">
    {job && /^[a-zA-Z0-9-]+$/.test(job) && <a href={`/jobs/${job}/apply`} className="inline-block text-rose underline">Return to your application after saving</a>}
    <ProfileEditor initial={initial} initialShareId={saved?.shareId} accountEmail={user.email} accountName={saved?.profile.name || account?.displayName || account?.name || undefined} />
    <a href="/dashboard#applications" className="inline-flex min-h-11 items-center text-rose underline underline-offset-4">View your applications</a>
  </main><Footer /></>;
}

import { BrandLink } from "@/components/brand-link";
import { notFound } from "next/navigation";
import { boardBindings } from "@/lib/job-board/access";
import { creatorProfileSchema } from "@/lib/job-board/profiles";
import { CreatorProfileView } from "@/components/job-board/creator-profile-view";
export const dynamic = "force-dynamic";
export const metadata = { title: "Creator profile — ugc.community", robots: { index: false, follow: false } };
export default async function SharedProfilePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const row = await (await boardBindings()).JOB_BOARD.prepare("SELECT profile_json FROM board_creator_profiles WHERE share_id=?").bind(shareId).first<{ profile_json: string }>();
  if (!row) notFound();
  return <main className="container max-w-2xl py-16 space-y-6"><BrandLink href="/jobs" /><CreatorProfileView profile={creatorProfileSchema.parse(JSON.parse(row.profile_json))} /><a href="/post-job" className="inline-block underline">Hiring creators? Post a job for free.</a></main>;
}

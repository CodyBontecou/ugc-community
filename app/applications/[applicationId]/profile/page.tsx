import { BrandLink } from "@/components/brand-link";
import { notFound } from "next/navigation";
import { boardBindings } from "@/lib/job-board/access";
import { creatorProfileSchema } from "@/lib/job-board/profiles";
import { CreatorProfileView } from "@/components/job-board/creator-profile-view";
export const dynamic = "force-dynamic";
export const metadata = { title: "Applicant profile — ugc.community", robots: { index: false, follow: false } };
export default async function ApplicantProfilePage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const application = await (await boardBindings()).JOB_BOARD.prepare("SELECT profile_json FROM board_applications WHERE id=? AND status='sent'").bind(applicationId).first<{ profile_json: string }>();
  if (!application) notFound();
  return <main className="container max-w-2xl py-16 space-y-6"><BrandLink href="/jobs" /><CreatorProfileView profile={creatorProfileSchema.parse(JSON.parse(application.profile_json))} /><p className="text-sm text-warm-gray-600">This is the creator profile included with the application. Reply to the application email to contact them.</p><a href="/post-job" className="inline-block underline">Hiring creators? Post your next job on ugc.community.</a></main>;
}

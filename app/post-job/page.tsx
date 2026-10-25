import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { Navbar, BackgroundBlobs, Footer } from "@/components/landing";
import { SubmissionForm } from "@/components/job-board/submission-form";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Post a UGC Job for Free — ugc.community", alternates: { canonical: "/post-job" } };
export default async function PostJobPage() {
  if (!await getServerSession()) redirect("/sign-in?callbackUrl=/post-job");
  return <div className="relative overflow-hidden min-h-screen"><BackgroundBlobs /><Navbar /><main className="container relative z-[1] max-w-3xl pt-28 sm:pt-32 pb-24"><span className="text-sm text-rose">For brands and agencies</span><h1 className="text-3xl sm:text-4xl mt-3 mb-4">Post your UGC job</h1><p className="text-base text-warm-gray-600 mb-6">Share your brief for free. We review every listing before it reaches creators.</p><SubmissionForm /><p className="mt-6 text-sm"><a href="/dashboard/postings" className="inline-flex min-h-11 items-center underline underline-offset-4">View your postings and analytics</a></p></main><Footer /></div>;
}

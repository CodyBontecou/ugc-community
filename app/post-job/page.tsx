import type { Metadata } from "next";
import { Navbar, BackgroundBlobs, Footer } from "@/components/landing";
import { SubmissionForm } from "@/components/job-board/submission-form";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Post a UGC Job for Free — ugc.community", alternates: { canonical: "/post-job" } };
export default async function PostJobPage() {
  return <div className="relative overflow-hidden min-h-screen"><BackgroundBlobs /><Navbar /><main className="container relative z-[1] max-w-3xl pt-36 pb-24"><span className="text-sm text-rose">For brands and agencies</span><h1 className="text-[clamp(2.5rem,6vw,4rem)] mt-4 mb-5">Your next creator.<br /><span className="gradient-text">Start with a clear brief.</span></h1><p className="text-lg text-warm-gray-600 mb-10">Submit a job for free. Include compensation, deliverables, eligibility, usage rights, and a closing date. Every listing is reviewed before it goes live.</p><SubmissionForm /></main><Footer /></div>;
}

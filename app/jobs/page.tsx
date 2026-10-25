import type { Metadata } from "next";
import { Navbar, BackgroundBlobs, Footer } from "@/components/landing";
import { JobFeed } from "@/components/job-board/feed";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "UGC Jobs — ugc.community", description: "Find reviewed UGC opportunities. Search external jobs and directly posted roles, with compensation and source context.", alternates: { canonical: "/jobs" } };
export default async function JobsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <div className="relative overflow-hidden min-h-screen"><BackgroundBlobs /><Navbar /><main><div className="container relative z-[1] pt-36 pb-12 text-center"><span className="text-sm text-rose">The UGC job board</span><h1 className="text-[clamp(2.5rem,6vw,4rem)] mt-4 mb-5">Find your next <span className="gradient-text">UGC opportunity.</span></h1><p className="text-warm-gray-600 max-w-xl mx-auto">Collected opportunities and brand-posted jobs, together in one searchable feed.</p></div><JobFeed params={await searchParams} /></main><Footer /></div>;
}

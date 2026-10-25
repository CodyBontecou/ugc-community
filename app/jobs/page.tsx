import type { Metadata } from "next";
import { JobsHeading } from "@/components/job-board/jobs-heading";
import { Navbar, BackgroundBlobs, Footer } from "@/components/landing";
import { JobFeed } from "@/components/job-board/feed";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "UGC Jobs — ugc.community", description: "Find reviewed UGC opportunities. Search external jobs and directly posted roles, with compensation and source context.", alternates: { canonical: "/jobs" } };

export default async function JobsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundBlobs /><Navbar />
      <main>
        <JobsHeading />
        <JobFeed params={await searchParams} />
      </main>
      <Footer />
    </div>
  );
}

import { Navbar, BackgroundBlobs, Hero, FAQ, Footer } from "@/components/landing";
import { JobFeed } from "@/components/job-board/feed";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="relative overflow-hidden">
      <BackgroundBlobs />
      <Navbar />
      <main>
        <Hero />
        <JobFeed params={await searchParams} basePath="/" />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

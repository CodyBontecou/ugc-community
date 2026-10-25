import { Navbar, BackgroundBlobs, Hero, Features, HowItWorks, Pricing, FAQ, FinalCTA, Footer } from "@/components/landing";
import { JobFeed } from "@/components/job-board/feed";
export const dynamic = "force-dynamic";
export default function HomePage() {
  return <div className="relative overflow-hidden"><BackgroundBlobs /><Navbar /><main><Hero /><JobFeed /><Features /><HowItWorks /><Pricing /><FAQ /><FinalCTA /></main><Footer /></div>;
}

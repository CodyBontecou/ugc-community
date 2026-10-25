import { Navbar, BackgroundBlobs, Hero, Features, HowItWorks, Pricing, FAQ, FinalCTA, Footer } from "@/components/landing";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <BackgroundBlobs />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

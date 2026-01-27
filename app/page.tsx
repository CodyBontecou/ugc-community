import {
  Navbar,
  BackgroundBlobs,
  Hero,
  SocialProof,
  Features,
  PortfolioExamples,
  HowItWorks,
  Testimonials,
  Pricing,
  FinalCTA,
  Footer,
} from "@/components/landing";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <BackgroundBlobs />
      <Navbar />
      <Hero />
      <SocialProof />
      <Features />
      <PortfolioExamples />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}

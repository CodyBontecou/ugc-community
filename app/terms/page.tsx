import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms — ugc.community",
  description: "Terms for creator accounts, portfolio hosting, campaign participation, rewards, and acceptable use on ugc.community.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fff5f3] px-6 py-20">
      <article className="mx-auto max-w-3xl rounded-3xl border border-warm-gray-100 bg-white p-8 md:p-12">
        <Link href="/" className="text-rose hover:underline">← ugc.community</Link>
        <h1 className="mt-8 text-5xl text-warm-gray-900">Terms</h1>
        <p className="mt-3 text-sm text-warm-gray-500">Last updated October 24, 2026</p>
        <div className="mt-10 space-y-8 leading-7 text-warm-gray-600">
          <section><h2 className="text-2xl text-warm-gray-900">Job board participation</h2><p className="mt-3">Browsing and job submissions are free during launch. Submissions are reviewed before publication and must state compensation, deliverables, eligibility, usage rights, an application destination, and a closing date. External opportunities link to a third-party hiring process. Employers manage applications and hiring terms; a listing or review does not guarantee acceptance, payment, or employer legitimacy. Report incorrect or expired listings to cody@isolated.tech.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Your account and content</h2><p className="mt-3">You are responsible for account activity and for having the rights needed to upload, display, or link creator content. You keep ownership of your content and grant ugc.community the permission needed to host, format, display, and deliver the portfolio and directory features you choose.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Campaigns and rewards</h2><p className="mt-3">Campaign hooks, automated matches, milestones, and rewards depend on qualifying activity and the current program rules. A listing or match is not a guarantee of a brand deal, payment, audience result, or continued reward eligibility.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Acceptable use</h2><p className="mt-3">Do not upload unlawful, deceptive, infringing, abusive, malicious, or privacy-invasive content; impersonate another creator; interfere with the service; or use automated access in a way that harms other users or the platform.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Availability and enforcement</h2><p className="mt-3">Features can change as the creator program evolves. Accounts or hosted sites may be limited or removed for security issues, policy violations, legal requirements, inactivity rules disclosed by the program, or conduct that risks creators, brands, or the service.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Contact</h2><p className="mt-3">Questions about these terms can be sent to <a className="text-rose hover:underline" href="mailto:cody@isolated.tech">cody@isolated.tech</a>.</p></section>
        </div>
      </article>
    </main>
  );
}

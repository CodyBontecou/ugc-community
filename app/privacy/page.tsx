import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy — ugc.community",
  description: "How ugc.community handles accounts, creator portfolios, connected-platform activity, analytics, and contact submissions.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fff5f3] px-6 py-20">
      <article className="mx-auto max-w-3xl rounded-3xl border border-warm-gray-100 bg-white p-8 md:p-12">
        <Link href="/" className="text-rose hover:underline">← ugc.community</Link>
        <h1 className="mt-8 text-5xl text-warm-gray-900">Privacy</h1>
        <p className="mt-3 text-sm text-warm-gray-500">Last updated October 24, 2026</p>
        <div className="mt-10 space-y-8 leading-7 text-warm-gray-600">
          <section><h2 className="text-2xl text-warm-gray-900">Job listings and source records</h2><p className="mt-3">The job board retains public source posts and comments, their original dates, collection dates, and review decisions to assess opportunities and freshness. Original source text stays in the private review queue; published external listings use a reviewed summary and original source/application links. Direct job submissions include the terms you provide. Your contact email is used for submission administration and is not displayed in the public listing. Anonymous submission limits use a salted hash of the requesting network address; the raw address is not stored with the job. For corrections or removal requests, email cody@isolated.tech with the listing or source link.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Accounts and portfolios</h2><p className="mt-3">When you create an account, claim a subdomain, upload portfolio files, complete onboarding, or submit profile details, ugc.community processes that information to provide the account, public portfolio, creator directory, and administrative tools you request.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Creator profiles and job applications</h2><p className="mt-3">Saving a quick-apply profile creates a page accessible to anyone with its link, containing the name, bio, location, availability, and social or portfolio links you choose to provide. Your email address is not shown on that profile page. When you confirm an email application, we share your profile, application message, and reply email with the listed employer through our email provider. We retain an application snapshot and sending status for your application history and safe retries. Editing your profile affects future applications; it does not change an application already submitted or recall an employer’s email. For profile or application removal requests, contact cody@isolated.tech.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Connected content activity</h2><p className="mt-3">If you connect or provide a TikTok handle, the service can check public account and post activity, match content to campaign hooks, and calculate milestones or rewards. Disconnecting an account does not automatically remove public posts from the original platform.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Analytics and referral measurement</h2><p className="mt-3">The service records portfolio and profile activity for creator analytics. Portfolio views use a shortened hash of the requesting IP address to avoid counting the same viewer repeatedly within a 24-hour window. Coarse referral categories—such as ChatGPT, Perplexity, Claude, Copilot, Gemini, direct, or other—may be written to operational logs. The site also uses aggregate web analytics for traffic and performance.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Forms and service providers</h2><p className="mt-3">Contact submissions and support messages are used to deliver and respond to the request. Hosting, database, file-storage, email, security, and analytics providers process information as needed to operate the service. ugc.community does not sell creator portfolio content as an advertising profile.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Contact</h2><p className="mt-3">Questions or account requests can be sent to <a className="text-rose hover:underline" href="mailto:cody@isolated.tech">cody@isolated.tech</a>.</p></section>
        </div>
      </article>
    </main>
  );
}

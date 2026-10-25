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
          <section><h2 className="text-2xl text-warm-gray-900">Creator database records</h2><p className="mt-3">The private creator database indexes contact details and links shared in public r/UGCcreators posts and comments, together with the author, source context, and collection date. Live access is currently restricted to administrators. Public sharing does not establish that a detail belongs to the author or that someone is available for work. For corrections or removal requests, email cody@isolated.tech with the record or source link.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Database early access</h2><p className="mt-3">If you join the creator database early-access list, we store your email to send database launch and subscription updates. Contact cody@isolated.tech to leave the list or request deletion. The database preview uses fictional sample records. Subscription access is not yet available.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Accounts and portfolios</h2><p className="mt-3">When you create an account, claim a subdomain, upload portfolio files, complete onboarding, or submit profile details, ugc.community processes that information to provide the account, public portfolio, creator directory, and administrative tools you request.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Connected content activity</h2><p className="mt-3">If you connect or provide a TikTok handle, the service can check public account and post activity, match content to campaign hooks, and calculate milestones or rewards. Disconnecting an account does not automatically remove public posts from the original platform.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Analytics and referral measurement</h2><p className="mt-3">The service records portfolio and profile activity for creator analytics. Portfolio views use a shortened hash of the requesting IP address to avoid counting the same viewer repeatedly within a 24-hour window. Coarse referral categories—such as ChatGPT, Perplexity, Claude, Copilot, Gemini, direct, or other—may be written to operational logs. The site also uses aggregate web analytics for traffic and performance.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Forms and service providers</h2><p className="mt-3">Contact submissions and support messages are used to deliver and respond to the request. Hosting, database, file-storage, email, security, and analytics providers process information as needed to operate the service. ugc.community does not sell creator portfolio content as an advertising profile.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Contact</h2><p className="mt-3">Questions or account requests can be sent to <a className="text-rose hover:underline" href="mailto:cody@isolated.tech">cody@isolated.tech</a>.</p></section>
        </div>
      </article>
    </main>
  );
}

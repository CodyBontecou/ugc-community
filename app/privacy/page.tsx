import { BrandLink } from "@/components/brand-link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — ugc.community",
  description: "How ugc.community handles job listings, creator profiles, applications, accounts, and analytics.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#fff5f3] px-4 py-8 sm:px-6 sm:py-20">
      <article className="mx-auto max-w-3xl rounded-3xl border border-warm-gray-100 bg-white p-5 sm:p-8 md:p-12">
        <BrandLink />
        <h1 className="mt-8 text-4xl sm:text-5xl text-warm-gray-900">Privacy</h1>
        <p className="mt-3 text-sm text-warm-gray-500">Last updated October 25, 2026</p>
        <div className="mt-10 space-y-8 leading-7 text-warm-gray-600">
          <section><h2 className="text-2xl text-warm-gray-900">Job listings and source records</h2><p className="mt-3">The job board retains public source posts and comments, their original dates, collection dates, and review decisions to assess opportunities and freshness. Original source text stays in the private review queue; published external listings use a reviewed summary and original source/application links. Direct job submissions include the terms you provide. Your contact email is used for submission administration and is not displayed in the public listing. Posting a job requires an account. We associate submissions with your account and use it to enforce daily submission limits. For corrections or removal requests, email cody@isolated.tech with the listing or source link.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Accounts</h2><p className="mt-3">When you create an account or submit creator details, ugc.community processes your account information to provide sign-in, creator profiles, job applications, and administrative support.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Creator profiles and job applications</h2><p className="mt-3">Saving a quick-apply profile creates a page accessible to anyone with its link, containing the name, bio, location, availability, and social or portfolio links you choose to provide. Your email address is not shown on that profile page. When you confirm an email application, we share your profile, application message, and reply email with the listed employer through our email provider. We retain an application snapshot and sending status for your application history and safe retries. Editing your profile affects future applications; it does not change an application already submitted or recall an employer’s email. For profile or application removal requests, contact cody@isolated.tech.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Legacy account records</h2><p className="mt-3">Earlier versions of ugc.community offered hosted portfolios and connected-platform features. Existing files and account activity records may remain stored after those features are retired. Contact cody@isolated.tech for questions about earlier records or to request removal.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Analytics and referral measurement</h2><p className="mt-3">Analytics is optional and starts only when you choose Allow analytics. We measure page views, coarse referral sources and device groups, time on visible pages, scroll milestones, job brief opens, application clicks, form starts and errors, and completed profile saves, applications, and job submissions. A random anonymous session cookie expires after 30 minutes without measured activity. Your consent preference is stored in this browser. Analytics events do not contain account IDs, email addresses, IP addresses, form text, search terms, complete referral URLs, or profile share links. We retain activity events for 90 days. Sitewide reports are restricted to administrators. Job posters can view aggregate activity for postings submitted from their own account. Vercel traffic analytics is also enabled only with permission. Do Not Track and Global Privacy Control disable analytics. Use Analytics preferences on this page to change your choice; declining stops collection and clears the anonymous session cookie. Previously collected anonymous events expire under the retention policy. External application clicks do not tell us whether an application was completed.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Forms and service providers</h2><p className="mt-3">Contact submissions and support messages are used to deliver and respond to the request. Hosting, database, file-storage, email, security, and analytics providers process information as needed to operate the service. ugc.community does not sell creator profile content as an advertising profile.</p></section>
          <section><h2 className="text-2xl text-warm-gray-900">Contact</h2><p className="mt-3">Questions or account requests can be sent to <a className="text-rose hover:underline" href="mailto:cody@isolated.tech">cody@isolated.tech</a>.</p></section>
        </div>
      </article>
    </main>
  );
}

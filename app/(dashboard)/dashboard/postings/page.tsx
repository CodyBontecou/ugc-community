import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { analyticsDatabase } from "@/lib/analytics/server";
import { postingReport, postingPage, PostingNotFound } from "@/lib/analytics/postings";
import { reportDays } from "@/lib/analytics/model";
import { PostingReportView } from "@/components/analytics/posting-report";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your job postings — ugc.community", robots: { index: false, follow: false } };
export default async function YourPostingsPage({ searchParams }: { searchParams: Promise<{ days?: string; job?: string; page?: string }> }) {
  const session = await getServerSession();
  if (!session) return null; // Dashboard layout handles sign-in and account status.
  const params = await searchParams;
  if (params.job && params.job.length > 100) notFound();
  let report;
  try { report = await postingReport(await analyticsDatabase(), session.user.id, { days: reportDays(params.days), jobId: params.job, page: postingPage(params.page) }); }
  catch (error) {
    if (error instanceof PostingNotFound) notFound();
    return <section role="alert" className="rounded-2xl border border-warm-gray-200 bg-white p-6"><h1 className="text-2xl">Your posting analytics is temporarily unavailable</h1><p className="mt-3 text-sm text-warm-gray-600">Please try again shortly. Your submissions are still saved.</p><Link href="/dashboard/postings" className="mt-4 inline-flex min-h-11 items-center underline">Try again</Link></section>;
  }
  return <PostingReportView report={report} />;
}

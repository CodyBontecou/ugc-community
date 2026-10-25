import Link from "next/link";
import { redirect } from "next/navigation";
import { boardAdmin } from "@/lib/job-board/access";
import { analyticsDatabase } from "@/lib/analytics/server";
import { analyticsReport } from "@/lib/analytics/report";
import { reportDays } from "@/lib/analytics/model";
import { AnalyticsReportView } from "@/components/analytics/analytics-report";
export const dynamic = "force-dynamic";
export default async function ProductAnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  if (!await boardAdmin()) redirect("/sign-in");
  const days = reportDays((await searchParams).days);
  let report;
  try { report = await analyticsReport(await analyticsDatabase(), days); }
  catch { return <section role="alert" className="rounded-2xl border border-warm-gray-200 bg-white p-6"><h2 className="text-2xl">Analytics is unavailable</h2><p className="mt-3 text-sm text-warm-gray-600">Check the JOB_BOARD database binding and apply migration 0004_behavior_analytics. Tracking failures do not interrupt applications or job submissions.</p><Link href="?days=30" className="mt-4 inline-block underline">Try again</Link></section>; }
  return <AnalyticsReportView report={report} />;
}

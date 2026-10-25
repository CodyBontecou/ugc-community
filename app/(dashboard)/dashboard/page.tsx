import { getServerSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { boardBindings } from "@/lib/job-board/access";
import { getCreatorProfile } from "@/lib/job-board/profiles";
import { listCreatorApplications, type ApplicationHistoryEntry } from "@/lib/job-board/application-history";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your job search — ugc.community",
  description: "Manage your creator profile and email applications.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) return null;
  let profile: Awaited<ReturnType<typeof getCreatorProfile>> = null;
  let profileSaved: boolean | null = null;
  let applications: ApplicationHistoryEntry[] | null = null;
  try {
    const { JOB_BOARD } = await boardBindings();
    const [profileResult, historyResult] = await Promise.allSettled([
      getCreatorProfile(JOB_BOARD, session.user.id),
      listCreatorApplications(JOB_BOARD, session.user.id),
    ]);
    if (profileResult.status === "fulfilled") {
      profile = profileResult.value;
      profileSaved = Boolean(profile);
    }
    if (historyResult.status === "fulfilled") applications = historyResult.value;
  } catch {
    // Keep navigation usable and show truthful unavailable states.
  }
  return <DashboardShell userName={session.user.name || "Creator"} profileSaved={profileSaved} profileShareId={profile?.shareId} applications={applications} />;
}

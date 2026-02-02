import { Suspense } from "react";
import { getServerSession } from "@/lib/auth/session";
import { OnboardingSlides } from "@/components/dashboard/onboarding-slides";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Dashboard - ugc.community",
  description: "Your ugc.community dashboard",
};

// Force dynamic rendering - dashboard needs auth session
export const dynamic = "force-dynamic";

async function DashboardContent() {
  const session = await getServerSession();
  if (!session) return null;

  const isUserAdmin = isAdmin(session.user.email);
  // Show creator content for everyone except admins
  const showCreatorContent = !isUserAdmin;

  return (
    <div className="max-w-4xl mx-auto min-h-[calc(100vh-12rem)] flex flex-col justify-center">
      {/* Onboarding Slides */}
      {showCreatorContent && <OnboardingSlides />}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse max-w-4xl mx-auto min-h-[calc(100vh-12rem)] flex flex-col justify-center">
          <div className="h-[500px] bg-warm-gray-200 rounded-[--radius-xl]" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

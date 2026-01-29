import { Suspense } from "react";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SubdomainInline } from "@/components/dashboard/subdomain-inline";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - ugc.community",
  description: "Your ugc.community dashboard",
};

// Force dynamic rendering - dashboard needs auth session
export const dynamic = "force-dynamic";

async function DashboardContent() {
  const session = await getServerSession();
  if (!session) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { subdomain: true },
  });

  const firstName = session.user.name?.split(" ")[0] || "Creator";
  const subdomain = user?.subdomain || null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-4">
          Hey {firstName}!
        </h1>
        <p className="text-lg text-warm-gray-500">
          Welcome to your dashboard
        </p>
      </div>

      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <SubdomainInline initialSubdomain={subdomain} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-warm-gray-200 rounded w-1/3 mx-auto" />
          <div className="h-24 bg-warm-gray-200 rounded-[--radius-xl] max-w-2xl mx-auto" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

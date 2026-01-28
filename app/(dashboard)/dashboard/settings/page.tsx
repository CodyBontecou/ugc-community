import { Suspense } from "react";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SubdomainSettings } from "@/components/dashboard/subdomain-settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - ugc.community",
  description: "Manage your account settings",
};

export const dynamic = "force-dynamic";

async function SettingsContent() {
  const session = await getServerSession();
  if (!session) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { subdomain: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900">
          Settings
        </h1>
        <p className="mt-1 text-warm-gray-500">
          Manage your account and portfolio settings
        </p>
      </div>

      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <SubdomainSettings initialSubdomain={user?.subdomain || null} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-warm-gray-200 rounded w-1/4" />
          <div className="h-64 bg-warm-gray-200 rounded-[--radius-xl]" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

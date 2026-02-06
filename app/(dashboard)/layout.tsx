import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { DashboardNav } from "@/components/dashboard/nav";
import { DashboardProviders } from "@/components/dashboard/providers";
import { isAdmin, canAccessDashboard, type UserStatus } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Check user status to block suspended/banned users
  const user = await db
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const userStatus = (user[0]?.status || "active") as UserStatus;

  if (!canAccessDashboard(userStatus)) {
    redirect(`/account-suspended?status=${userStatus}`);
  }

  const userIsAdmin = isAdmin(session.user.email);

  return (
    <DashboardProviders>
      <div className="min-h-screen bg-warm-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-warm-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="font-semibold text-warm-gray-900">
                ugc.community
              </Link>

              <DashboardNav user={session.user} isAdmin={userIsAdmin} />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </DashboardProviders>
  );
}

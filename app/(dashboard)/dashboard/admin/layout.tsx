import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session || !isAdmin(session.user.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900">
          Admin Panel
        </h1>
        <p className="mt-1 text-warm-gray-500">
          Review opportunities, validate job supply, and manage the community
        </p>
      </div>

      <a href="/dashboard/admin/opportunities" className="inline-block text-sm text-warm-gray-700 underline underline-offset-4">Job review & supply validation →</a>

      {children}
    </div>
  );
}

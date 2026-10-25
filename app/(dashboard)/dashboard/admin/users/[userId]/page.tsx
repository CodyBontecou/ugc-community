import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { boardAdmin, boardBindings } from "@/lib/job-board/access";
import { getCreatorProfile } from "@/lib/job-board/profiles";
import { CreatorProfileView } from "@/components/job-board/creator-profile-view";

export const dynamic = "force-dynamic";
export default async function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  if (!await boardAdmin()) redirect("/dashboard");
  const { userId } = await params;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { name: true, email: true, status: true, createdAt: true } });
  if (!user) notFound();
  let profile: Awaited<ReturnType<typeof getCreatorProfile>> = null;
  let profileAvailable = true;
  try { profile = await getCreatorProfile((await boardBindings()).JOB_BOARD, userId); } catch { profileAvailable = false; }
  return <div className="max-w-3xl space-y-6">
    <Link href="/dashboard/admin" className="inline-flex min-h-11 items-center text-rose underline underline-offset-4">Back to community accounts</Link>
    <section className="rounded-[28px] border border-warm-gray-200 bg-white p-5 sm:p-8 [overflow-wrap:anywhere]">
      <h2 className="mb-3 text-3xl">{user.name || "Creator account"}</h2><p className="text-warm-gray-600">{user.email}</p>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="font-medium">Account status</dt><dd className="mt-1 capitalize">{user.status}</dd></div><div><dt className="font-medium">Joined</dt><dd className="mt-1">{user.createdAt.toISOString().slice(0, 10)}</dd></div></dl>
      <p className="mt-5 text-sm text-warm-gray-600">Manage account status from the community accounts table.</p>
    </section>
    {profile ? <CreatorProfileView profile={profile.profile} /> : <p className="text-warm-gray-600">{profileAvailable ? "This account has not saved a quick-apply profile yet." : "The creator profile is temporarily unavailable."}</p>}
  </div>;
}

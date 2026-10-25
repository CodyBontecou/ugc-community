import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getServerSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
export async function boardBindings() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.JOB_BOARD || !env.SUBSCRAPE_EXPORTS) throw new Error("Job board bindings unavailable");
  return { JOB_BOARD: env.JOB_BOARD, SUBSCRAPE_EXPORTS: env.SUBSCRAPE_EXPORTS };
}
export async function boardAdmin() {
  const session = await getServerSession();
  return session && isAdmin(session.user.email) ? session : null;
}

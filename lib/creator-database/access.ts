import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getServerSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";

// Central entitlement boundary. Database buyers can be added here once the
// subscription webhook stores verified entitlements; being signed in is not enough.
export async function canAccessCreatorDatabase() {
  const session = await getServerSession();
  return Boolean(session?.user && isAdmin(session.user.email));
}

export async function creatorBindings() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.CREATOR_DATABASE || !env.SUBSCRAPE_EXPORTS) throw new Error("Creator database bindings are unavailable");
  return { CREATOR_DATABASE: env.CREATOR_DATABASE, SUBSCRAPE_EXPORTS: env.SUBSCRAPE_EXPORTS };
}

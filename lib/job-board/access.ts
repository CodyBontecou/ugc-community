import "server-only";
import { getServerSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
export { boardBindings } from "./bindings";

export async function boardAdmin() {
  const session = await getServerSession();
  return session && isAdmin(session.user.email) ? session : null;
}

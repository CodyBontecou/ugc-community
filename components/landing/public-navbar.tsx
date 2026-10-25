import { cookies } from "next/headers";
import { Navbar } from "./navbar";

export async function PublicNavbar() {
  const jar = await cookies();
  // A cookie is only a hint to load the client; Better Auth still validates it.
  const checkSession = jar.has("better-auth.session_token") || jar.has("__Secure-better-auth.session_token");
  return <Navbar checkSession={checkSession} />;
}

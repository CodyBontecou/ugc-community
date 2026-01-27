import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Full-screen layout without dashboard chrome for the editor
  return <>{children}</>;
}

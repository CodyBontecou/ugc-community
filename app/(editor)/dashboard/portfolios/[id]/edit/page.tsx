import { redirect } from "next/navigation";

// Redirect old editor routes to new single-portfolio editor
export default async function EditorRedirectPage() {
  redirect("/dashboard/portfolio/edit");
}

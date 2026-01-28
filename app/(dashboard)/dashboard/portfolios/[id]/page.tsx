import { redirect } from "next/navigation";

// Redirect old portfolio routes to new single-portfolio route
export default async function PortfolioRedirectPage() {
  redirect("/dashboard/portfolio");
}

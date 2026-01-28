import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio - ugc.community",
  description: "Your UGC portfolio",
};

// Force dynamic rendering - needs auth session
export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  // Get user's portfolio
  const portfolio = await db.query.portfolios.findFirst({
    where: eq(portfolios.userId, session.user.id),
  });

  // If user has an HTML portfolio, redirect to the interactive editor
  if (portfolio?.portfolioType === "html" && portfolio.htmlContent) {
    redirect("/dashboard/portfolio/edit");
  }

  // For no portfolio or JSON portfolios, redirect to AI generator
  redirect("/dashboard/ai-generate");
}

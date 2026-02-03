import Link from "next/link";
import { ExternalLink, Globe, AlertCircle } from "lucide-react";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { onboardingQuestionnaires, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const session = await getServerSession();
  if (!session) return null;

  const [user, questionnaire] = await Promise.all([
    db
      .select({ subdomain: users.subdomain })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)
      .then((rows) => rows[0] || null),
    db
      .select({ id: onboardingQuestionnaires.id })
      .from(onboardingQuestionnaires)
      .where(eq(onboardingQuestionnaires.userId, session.user.id))
      .limit(1)
      .then((rows) => rows[0] || null),
  ]);

  const hasQuestionnaire = Boolean(questionnaire);
  const subdomain = user?.subdomain || null;
  const domain = process.env.NEXT_PUBLIC_DOMAIN || "ugc.community";
  const portfolioUrl = subdomain ? `https://${subdomain}.${domain}` : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          Portfolio
        </h1>
        <p className="text-warm-gray-500">
          Share your media kit link with brands and partners.
        </p>
      </div>

      {!hasQuestionnaire && (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-coral mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-warm-gray-900">Complete your media kit</h2>
              <p className="text-sm text-warm-gray-600 mt-1">
                Fill out the onboarding form to publish your portfolio.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-coral hover:text-coral/80 mt-4"
              >
                Go to onboarding
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {hasQuestionnaire && !subdomain && (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-coral mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-warm-gray-900">Pick a subdomain</h2>
              <p className="text-sm text-warm-gray-600 mt-1">
                Add a subdomain in your onboarding form to publish your portfolio.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-coral hover:text-coral/80 mt-4"
              >
                Update your media kit
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {portfolioUrl && (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-mint" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-warm-gray-900">Your portfolio is live</h2>
              <p className="text-sm text-warm-gray-600 mt-1">
                Share this link with brands and partners.
              </p>
            </div>
          </div>

          <div className="rounded-[--radius-md] border border-warm-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-sm text-warm-gray-700">{portfolioUrl}</span>
            <Link
              href={portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-coral hover:text-coral/80"
            >
              View portfolio
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="text-sm text-warm-gray-500">
        Need help?{" "}
        <Link className="text-coral hover:text-coral/80" href="mailto:support@ugc.community">
          Contact support
        </Link>
        .
      </div>
    </div>
  );
}

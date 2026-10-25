import { SignInForm } from "@/components/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - ugc.community",
  alternates: { canonical: "/sign-in" },
  robots: { index: false, follow: true },
  description: "Sign in to your ugc.community account",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const requested = (await searchParams).callbackUrl;
  const creatorDestination = requested === "/apply-profile" || /^\/jobs\/[a-zA-Z0-9-]+\/apply$/.test(requested || "");
  const callbackURL = creatorDestination ? requested! : requested === "/post-job" ? "/post-job" : requested === "/database" ? "/jobs" : "/dashboard";
  return (
    <>
      <SignInForm callbackURL={callbackURL} />
      <div className="w-full max-w-md px-2 text-center text-sm leading-relaxed text-warm-gray-600 sm:px-4">
        <p>Create an account or sign in to post a job, save a creator profile, or apply to email-enabled jobs. Browsing jobs and reading guides require no account. Job posting is free during launch.</p>
        <a href="/jobs" className="mt-3 inline-flex min-h-11 items-center justify-center text-purple-dark underline underline-offset-4">Browse UGC jobs without signing in</a>
      </div>
    </>
  );
}

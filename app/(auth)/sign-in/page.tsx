import { SignInForm } from "@/components/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - ugc.community",
  robots: { index: false, follow: true },
  description: "Sign in to your ugc.community account",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const requested = (await searchParams).callbackUrl;
  const callbackURL = requested === "/post-job" ? "/post-job" : requested === "/database" ? "/jobs" : "/dashboard";
  return <><div className="mx-auto max-w-md px-6 pt-8 text-center text-sm text-warm-gray-600"><p>Accounts are for personal creator tools. Browsing jobs, reading guides, and submitting an opportunity are public and free during launch.</p><a href="/jobs" className="mt-3 inline-block text-rose underline">Browse UGC jobs without signing in</a></div><SignInForm callbackURL={callbackURL} /></>;
}

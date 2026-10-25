import { SignInForm } from "@/components/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - ugc.community",
  description: "Sign in to your ugc.community account",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const callbackURL = (await searchParams).callbackUrl === "/database" ? "/database" : "/dashboard";
  return <SignInForm callbackURL={callbackURL} />;
}

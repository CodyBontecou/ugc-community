import { SignUpForm } from "@/components/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - ugc.community",
  description: "Create your account on ugc.community and start showcasing your work to brands",
};

export default async function SignUpPage() {
  return <SignUpForm />;
}

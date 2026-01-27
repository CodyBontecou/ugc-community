import { SignUpForm } from "@/components/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account - ugc.community",
  description: "Create your ugc.community portfolio account",
};

export default function SignUpPage() {
  return <SignUpForm />;
}

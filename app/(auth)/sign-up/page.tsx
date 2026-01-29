import { SignUpForm, WaitlistForm } from "@/components/auth";
import { validateInviteToken } from "@/lib/invites";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Waitlist - ugc.community",
  description: "Sign up for a chance to join ugc.community - currently invite only",
};

type SearchParams = Promise<{ invite?: string }>;

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { invite: inviteToken } = await searchParams;

  // Show waitlist form if no invite token
  if (!inviteToken) {
    return <WaitlistForm />;
  }

  // Validate the invite token
  const invite = await validateInviteToken(inviteToken);

  if (!invite) {
    return <InvalidInvitePage reason="invalid" />;
  }

  return <SignUpForm inviteToken={inviteToken} prefilledEmail={invite.email || undefined} />;
}

function InvalidInvitePage({ reason }: { reason: "invalid" | "expired" | "used" }) {
  const messages = {
    invalid: {
      title: "Invalid Invite Link",
      description: "This invite link is invalid or has already been used.",
    },
    expired: {
      title: "Invite Expired",
      description: "This invite link has expired. Please request a new one.",
    },
    used: {
      title: "Invite Already Used",
      description: "This invite link has already been used to create an account.",
    },
  };

  const { title, description } = messages[reason];

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-[--radius-xl] p-8 shadow-lg border border-warm-gray-100 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          {title}
        </h1>
        <p className="text-warm-gray-500 mb-6">{description}</p>
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 px-4 bg-warm-gray-900 text-white font-medium rounded-[--radius-md] hover:bg-warm-gray-800 transition-colors"
          >
            Return to Homepage
          </Link>
          <Link
            href="/sign-in"
            className="block w-full py-3 px-4 bg-white border border-warm-gray-200 text-warm-gray-700 font-medium rounded-[--radius-md] hover:bg-warm-gray-50 transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

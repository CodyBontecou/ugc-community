import Link from "next/link";
import { ShieldAlert, Mail } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Suspended - ugc.community",
  description: "Your account has been suspended",
};

export default async function AccountSuspendedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const isBanned = status === "banned";

  return (
    <div className="min-h-screen bg-warm-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={40} className="text-red-600" />
        </div>

        <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-3">
          {isBanned ? "Account Banned" : "Account Suspended"}
        </h1>

        <p className="text-warm-gray-600 mb-8">
          {isBanned
            ? "Your account has been permanently banned due to a violation of our terms of service."
            : "Your account has been temporarily suspended. This may be due to a violation of our terms of service or suspicious activity."}
        </p>

        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-warm-gray-900 mb-2">
            What can I do?
          </h2>
          <p className="text-sm text-warm-gray-600">
            {isBanned
              ? "If you believe this was a mistake, please contact our support team to appeal this decision."
              : "If you believe this was a mistake, please contact our support team. We'll review your case and get back to you as soon as possible."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:support@ugc.community"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-coral to-rose hover:opacity-90 rounded-full transition-opacity"
          >
            <Mail size={16} />
            Contact Support
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-warm-gray-700 bg-warm-gray-100 hover:bg-warm-gray-200 rounded-full transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserX, ArrowRight } from "lucide-react";

function AuthErrorContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-gray-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-[--radius-xl] p-8 shadow-lg border border-warm-gray-100 text-center"
      >
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserX className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          Authentication Error
        </h1>
        <p className="text-warm-gray-500 mb-6">
          Something went wrong during sign in. Please try again.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-coral-dark to-rose text-white font-medium rounded-[--radius-md] hover:opacity-90 transition-opacity"
        >
          Try Again
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-warm-gray-50 to-white flex items-center justify-center">
          <div className="animate-pulse text-warm-gray-400">Loading...</div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}

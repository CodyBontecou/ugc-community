"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { signIn } from "@/lib/auth/client";

export function SignInForm({ callbackURL = "/dashboard" }: { callbackURL?: string }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn.magicLink({
        email,
        callbackURL,
      });

      if (result.error) {
        setError(result.error.message || "Failed to send sign-in link");
        return;
      }

      setMagicLinkSent(true);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL,
      });

      if (result?.error) {
        setError(result.error.message || "Failed to sign in with Google");
        setIsGoogleLoading(false);
      }
    } catch {
      setError("Failed to sign in with Google");
      setIsGoogleLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-[--radius-xl] p-8 shadow-lg border border-warm-gray-100"
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-3">
              Check your email
            </h1>
            <p className="text-warm-gray-500 mb-6">
              We sent a sign-in link to{" "}
              <span className="font-medium text-warm-gray-700">{email}</span>
            </p>
            <p className="text-sm text-warm-gray-400 mb-6">
              Click the link in the email to sign in. It expires in 5 minutes.
            </p>
            <button
              onClick={() => {
                setMagicLinkSent(false);
                setEmail("");
              }}
              className="text-rose hover:text-rose/80 font-medium transition-colors text-sm"
            >
              Use a different email
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const anyLoading = isLoading || isGoogleLoading;

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-[--radius-xl] p-8 shadow-lg border border-warm-gray-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
            Welcome to ugc.community
          </h1>
          <p className="text-warm-gray-500">
            Create an account or sign in with your email
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-[--radius-md] text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-warm-gray-700 mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400"
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
                placeholder="you@example.com"
                required
                disabled={anyLoading}
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={anyLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-coral to-rose font-medium rounded-[--radius-md] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 text-white"
            whileHover={{ scale: anyLoading ? 1 : 1.01 }}
            whileTap={{ scale: anyLoading ? 1 : 0.99 }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending link...
              </>
            ) : (
              "Send sign-in link"
            )}
          </motion.button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-warm-gray-200" />
          <span className="text-sm text-warm-gray-400">or continue with</span>
          <div className="flex-1 h-px bg-warm-gray-200" />
        </div>

        <motion.button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={anyLoading}
          className="w-full py-3 px-4 bg-white border border-warm-gray-200 text-warm-gray-700 font-medium rounded-[--radius-md] hover:bg-warm-gray-50 hover:border-warm-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
          whileHover={{ scale: anyLoading ? 1 : 1.01 }}
          whileTap={{ scale: anyLoading ? 1 : 0.99 }}
        >
          {isGoogleLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9.002 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.712A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.33z"
              />
              <path
                fill="#EA4335"
                d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
              />
            </svg>
          )}
          Continue with Google
        </motion.button>


      </motion.div>
    </div>
  );
}

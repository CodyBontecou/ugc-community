"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, Loader2, Eye, EyeOff, AtSign } from "lucide-react";
import { signUp, signIn } from "@/lib/auth/client";

interface SignUpFormProps {
  inviteToken: string;
  prefilledEmail?: string;
}

export function SignUpForm({ inviteToken, prefilledEmail }: SignUpFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefilledEmail || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEmailLocked = !!prefilledEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic validation
    if (username && !/^[a-z0-9_-]+$/i.test(username)) {
      setError(
        "Username can only contain letters, numbers, underscores, and hyphens"
      );
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      // Create account first
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message || "Failed to create account");
        return;
      }

      // Mark invite as used
      const inviteResult = await fetch("/api/invites/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: inviteToken }),
      });

      if (!inviteResult.ok) {
        console.error("Failed to mark invite as used");
      }

      // If username provided, update user profile via API
      if (username.trim()) {
        await fetch("/api/user/username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.toLowerCase() }),
        });
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // Store invite token in sessionStorage for use after OAuth callback
      sessionStorage.setItem("pendingInviteToken", inviteToken);

      const result = await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });

      if (result?.error) {
        setError(result.error.message || "Failed to sign up with Google");
        sessionStorage.removeItem("pendingInviteToken");
        setIsLoading(false);
      }
      // If successful, browser redirects to Google OAuth - no need to reset loading
    } catch {
      setError("Failed to sign up with Google");
      sessionStorage.removeItem("pendingInviteToken");
      setIsLoading(false);
    }
  };

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
            Create your account
          </h1>
          <p className="text-warm-gray-500">
            Start showcasing your work to brands
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
              htmlFor="name"
              className="block text-sm font-medium text-warm-gray-700 mb-1.5"
            >
              Full name
            </label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400"
              />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
                placeholder="Your name"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-warm-gray-700 mb-1.5"
            >
              Username{" "}
              <span className="text-warm-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <AtSign
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400"
              />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full pl-10 pr-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
                placeholder="yourname"
                disabled={isLoading}
              />
            </div>
            {username && (
              <p className="mt-1.5 text-xs text-warm-gray-500">
                Your profile will be at{" "}
                <span className="text-rose font-medium">
                  {username}.ugc.community
                </span>
              </p>
            )}
          </div>

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
                onChange={(e) => !isEmailLocked && setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors ${isEmailLocked ? "bg-warm-gray-50" : ""}`}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                readOnly={isEmailLocked}
              />
            </div>
            {isEmailLocked && (
              <p className="mt-1.5 text-xs text-warm-gray-500">
                This invite was sent to this email address
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-warm-gray-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400"
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray-400 hover:text-warm-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-coral to-rose font-medium rounded-[--radius-md] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 text-white"
            whileHover={{ scale: isLoading ? 1 : 1.01 }}
            whileTap={{ scale: isLoading ? 1 : 0.99 }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
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
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-white border border-warm-gray-200 text-warm-gray-700 font-medium rounded-[--radius-md] hover:bg-warm-gray-50 hover:border-warm-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
          whileHover={{ scale: isLoading ? 1 : 1.01 }}
          whileTap={{ scale: isLoading ? 1 : 0.99 }}
        >
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
          Continue with Google
        </motion.button>

        <p className="mt-6 text-center text-sm text-warm-gray-500">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-rose hover:text-rose/80 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-warm-gray-400">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-warm-gray-600">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-warm-gray-600">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Mail,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// TikTok icon (not in Lucide)
function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          instagramHandle: instagram,
          tiktokHandle: tiktok,
          youtubeHandle: youtube,
          facebookHandle: facebook,
          twitterHandle: twitter,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        className="w-full max-w-md mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white rounded-[--radius-xl] p-8 shadow-lg border border-warm-gray-100 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
            You're on the list!
          </h1>
          <p className="text-warm-gray-500 mb-6">
            We've sent a confirmation to <strong>{email}</strong>. We'll reach
            out when it's your turn to join.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full py-3 px-4 bg-warm-gray-900 text-white font-medium rounded-[--radius-md] hover:bg-warm-gray-800 transition-colors"
          >
            Back to Homepage
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-[--radius-xl] p-8 shadow-lg border border-warm-gray-100">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-block text-xl font-semibold text-warm-gray-900 mb-4"
          >
            ugc.community
          </Link>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
            Join the Waitlist
          </h1>
          <p className="text-warm-gray-500 text-sm">
            We're rolling out slowly and are currently invite-only
          </p>
        </div>

        {/* Invite-only notice */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-[--radius-md] mb-6">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">Invite Only</p>
            <p className="text-amber-700 mt-1">
              Sign up below for a chance to receive an invite. We'll notify you
              when it's your turn.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-[--radius-md] mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email - Required */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-warm-gray-700 mb-1.5"
            >
              Email <span className="text-rose">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-warm-gray-50 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 pb-1">
            <p className="text-xs text-warm-gray-500 uppercase tracking-wider font-medium">
              Social Handles (Optional)
            </p>
          </div>

          {/* Instagram */}
          <div>
            <label
              htmlFor="instagram"
              className="block text-sm font-medium text-warm-gray-700 mb-1.5"
            >
              Instagram
            </label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray-400" />
              <input
                id="instagram"
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@username"
                className="w-full pl-10 pr-4 py-3 bg-warm-gray-50 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
              />
            </div>
          </div>

          {/* TikTok */}
          <div>
            <label
              htmlFor="tiktok"
              className="block text-sm font-medium text-warm-gray-700 mb-1.5"
            >
              TikTok
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400">
                <TikTokIcon size={18} />
              </div>
              <input
                id="tiktok"
                type="text"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="@username"
                className="w-full pl-10 pr-4 py-3 bg-warm-gray-50 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
              />
            </div>
          </div>

          {/* YouTube */}
          <div>
            <label
              htmlFor="youtube"
              className="block text-sm font-medium text-warm-gray-700 mb-1.5"
            >
              YouTube
            </label>
            <div className="relative">
              <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray-400" />
              <input
                id="youtube"
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="@channel"
                className="w-full pl-10 pr-4 py-3 bg-warm-gray-50 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
              />
            </div>
          </div>

          {/* Facebook */}
          <div>
            <label
              htmlFor="facebook"
              className="block text-sm font-medium text-warm-gray-700 mb-1.5"
            >
              Facebook
            </label>
            <div className="relative">
              <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray-400" />
              <input
                id="facebook"
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="@username"
                className="w-full pl-10 pr-4 py-3 bg-warm-gray-50 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
              />
            </div>
          </div>

          {/* Twitter/X */}
          <div>
            <label
              htmlFor="twitter"
              className="block text-sm font-medium text-warm-gray-700 mb-1.5"
            >
              X (Twitter)
            </label>
            <div className="relative">
              <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray-400" />
              <input
                id="twitter"
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@username"
                className="w-full pl-10 pr-4 py-3 bg-warm-gray-50 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-warm-gray-900 text-white font-medium rounded-[--radius-md] hover:bg-warm-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            whileHover={{ scale: isLoading ? 1 : 1.01 }}
            whileTap={{ scale: isLoading ? 1 : 0.99 }}
          >
            {isLoading ? "Submitting..." : "Join Waitlist"}
          </motion.button>
        </form>

        <p className="text-xs text-warm-gray-500 text-center mt-6">
          Already have an invite?{" "}
          <Link href="/sign-in" className="text-rose hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

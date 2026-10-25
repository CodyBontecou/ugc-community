"use client";

import { motion } from "framer-motion";
import { BrandLink } from "@/components/brand-link";
import Link from "next/link";
import { useSession } from "@/lib/auth/client";

export function Navbar() {
  const { data: session, isPending } = useSession();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 backdrop-blur-[12px]"
    >
      <div className="container flex items-center justify-between gap-3">
        <div className="min-w-0 md:flex-1">
          <BrandLink className="[&>span]:hidden min-[420px]:[&>span]:inline" />
        </div>

        <div className="hidden md:flex gap-6 lg:gap-10">
          <Link href="/post-job" className="inline-flex min-h-11 items-center text-[0.95rem] font-medium text-warm-gray-600 hover:text-warm-gray-900">
            Post a free job
          </Link>
          <Link href="/apply-profile" className="inline-flex min-h-11 items-center text-[0.95rem] font-medium text-warm-gray-600 hover:text-warm-gray-900">
            Quick-apply profile
          </Link>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 md:flex-1 md:gap-4">
          <Link href="/jobs" className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-r from-coral to-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90 sm:px-5">
            Browse jobs
          </Link>
          {isPending ? (
            <div className="w-8 h-8 rounded-full bg-warm-gray-200 animate-pulse" />
          ) : session?.user ? (
            <Link href="/dashboard" aria-label="Open your dashboard" className="inline-flex min-h-11 min-w-11 items-center justify-center">
              {session.user.image ? (
                <motion.img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-full cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                />
              ) : (
                <motion.div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white text-sm font-medium cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {session.user.name?.charAt(0) || "U"}
                </motion.div>
              )}
            </Link>
          ) : (
            <motion.a
              href="/sign-in"
              className="inline-flex min-h-11 items-center justify-center gap-2 font-medium rounded-full py-2 px-2 sm:px-3 text-sm text-warm-gray-700 hover:text-warm-gray-900 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Login
            </motion.a>
          )}
        </div>
      </div>
    </nav>
  );
}

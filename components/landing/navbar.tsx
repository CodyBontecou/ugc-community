"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "@/lib/auth/client";

export function Navbar() {
  const { data: session, isPending } = useSession();

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-[100] pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 backdrop-blur-[12px]"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="container flex items-center justify-between">
        <div className="flex-1">
          <Link href="/" className="font-semibold text-[1.1rem] text-warm-gray-900">
            ugc.community
          </Link>
        </div>

        <div className="hidden md:flex gap-12">
          <a
            href="/#features"
            className="text-[0.95rem] font-medium text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
          >
            How it works
          </a>
          <a
            href="/post-job"
            className="text-[0.95rem] font-medium text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
          >
            Post a job
          </a>
          <Link
            href="/jobs"
            className="text-[0.95rem] font-medium text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
          >
            Browse jobs
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-end gap-6">
          {isPending ? (
            <div className="w-8 h-8 rounded-full bg-warm-gray-200 animate-pulse" />
          ) : session?.user ? (
            <Link href="/dashboard">
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
              className="inline-flex items-center justify-center gap-2 font-medium rounded-full py-2 px-5 text-sm bg-gradient-to-r from-coral to-rose text-white hover:opacity-90 transition-opacity"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Login
            </motion.a>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

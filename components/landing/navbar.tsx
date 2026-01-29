"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Navbar() {
  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-[100] py-4 backdrop-blur-[20px] bg-cream/80 border-b border-warm-gray-100"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="container flex items-center justify-between">
        <Link href="/" className="font-semibold text-[1.1rem] text-warm-gray-900">
          ugc.community
        </Link>

        <div className="hidden md:flex gap-12">
          <a
            href="#features"
            className="text-[0.95rem] font-medium text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-[0.95rem] font-medium text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
          >
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-6">
          <motion.a
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 font-medium rounded-full py-2 px-5 text-sm bg-gradient-to-r from-coral to-rose text-white hover:opacity-90 transition-opacity"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign Up
          </motion.a>
        </div>
      </div>
    </motion.nav>
  );
}

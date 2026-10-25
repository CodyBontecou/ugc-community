"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth/client";

export default function NavbarAccount() {
  const { data: session, isPending } = useSession();
  return (isPending ? (
            <div className="w-8 h-8 rounded-full bg-warm-gray-200 animate-pulse" />
          ) : session?.user ? (
            <Link prefetch={false} href="/dashboard" aria-label="Open your dashboard" className="inline-flex min-h-11 min-w-11 items-center justify-center">
              {session.user.image ? (
                <Image
                  unoptimized
                  src={session.user.image}
                  width={32}
                  height={32}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-full cursor-pointer"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full primary-action flex items-center justify-center text-white text-sm font-medium cursor-pointer"
                >
                  {session.user.name?.charAt(0) || "U"}
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex min-h-11 items-center justify-center gap-2 font-medium rounded-full py-2 px-2 sm:px-3 text-sm text-warm-gray-700 hover:text-warm-gray-900 transition-colors"
            >
              Login
            </Link>
          ));
}

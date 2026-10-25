"use client";

import dynamic from "next/dynamic";
import { BrandLink } from "@/components/brand-link";
import Link from "next/link";

const NavbarAccount = dynamic(() => import("./navbar-account"));

export function Navbar({ checkSession = true }: { checkSession?: boolean }) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 backdrop-blur-[12px]"
    >
      <div className="container flex items-center justify-between gap-3">
        <div className="min-w-0 md:flex-1">
          <BrandLink className="[&>span]:hidden min-[420px]:[&>span]:inline" />
        </div>

        <div className="hidden md:flex gap-6 lg:gap-10">
          <Link prefetch={false} href="/post-job" className="inline-flex min-h-11 items-center text-[0.95rem] font-medium text-warm-gray-600 hover:text-warm-gray-900">
            Post a free job
          </Link>
          <Link prefetch={false} href="/apply-profile" className="inline-flex min-h-11 items-center text-[0.95rem] font-medium text-warm-gray-600 hover:text-warm-gray-900">
            Quick-apply profile
          </Link>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 md:flex-1 md:gap-4">
          <Link prefetch={false} href="/jobs" className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full primary-action px-4 py-2 text-sm font-medium text-white hover:opacity-90 sm:px-5">
            Browse jobs
          </Link>
          {checkSession ? <NavbarAccount /> : (
            <Link prefetch={false} href="/sign-in" className="inline-flex min-h-11 items-center justify-center rounded-full px-2 py-2 text-sm font-medium text-warm-gray-700 hover:text-warm-gray-900 sm:px-3">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

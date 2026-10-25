"use client";
import dynamic from "next/dynamic";
import { NavbarView } from "./navbar-view";
const NavbarAccount = dynamic(() => import("./navbar-account"));
export function Navbar({ checkSession = true }: { checkSession?: boolean }) {
  return <NavbarView account={checkSession ? <NavbarAccount /> : <a href="/sign-in" className="inline-flex min-h-11 items-center justify-center rounded-full px-2 py-2 text-sm font-medium text-warm-gray-700 hover:text-warm-gray-900 sm:px-3">Login</a>} />;
}

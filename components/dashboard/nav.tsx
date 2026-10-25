"use client";

import { AvatarImage } from "@/components/avatar-image";
import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  User,
  ChevronDown,
  Shield,
  Briefcase,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { signOut } from "@/lib/auth/client";

interface DashboardNavProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  isAdmin?: boolean;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/apply-profile", label: "Creator profile", icon: User },
  { href: "/dashboard/postings", label: "Your postings", icon: Briefcase },
  { href: "/jobs", label: "Browse jobs", icon: Briefcase },
];

export function DashboardNav({ user, isAdmin = false }: DashboardNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  let allNavItems = [...navItems];
  if (isAdmin) {
    allNavItems = [
      ...allNavItems,
      { href: "/dashboard/admin", label: "Admin", icon: Shield },
    ];
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Desktop Navigation Links */}
      <nav className="hidden xl:flex items-center gap-1">
        {allNavItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-colors relative ${
                isActive
                  ? "text-warm-gray-900 bg-warm-gray-50"
                  : "text-warm-gray-500 hover:text-warm-gray-800 hover:bg-warm-gray-50"
              }`}
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Account menu"
          aria-expanded={isOpen}
          aria-controls="dashboard-account-menu"
          className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-warm-gray-700 hover:bg-warm-gray-50 rounded-[var(--radius-md)] transition-colors"
        >
          {user.image ? (
            <AvatarImage size={32}
              src={user.image}
              alt={user.name}
              className="w-8 h-8 rounded-full ring-2 ring-warm-gray-100"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white text-sm font-medium ring-2 ring-warm-gray-100">
              {user.name?.charAt(0) || "U"}
            </div>
          )}
          <span className="hidden sm:inline max-w-[120px] truncate">
            {user.name}
          </span>
          <ChevronDown
            size={15}
            className={`text-warm-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                id="dashboard-account-menu"
                className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-[var(--radius-lg)] shadow-lg border border-warm-gray-200 py-1.5 z-50"
              >
                {/* User info header */}
                <div className="px-4 py-2.5 border-b border-warm-gray-100">
                  <p className="text-sm font-medium text-warm-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-warm-gray-500 truncate">
                    {user.email}
                  </p>
                </div>

                {/* Mobile-only nav items */}
                <div className="xl:hidden py-1 border-b border-warm-gray-100">
                  {allNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center min-h-11 gap-2.5 px-4 py-2 text-sm text-warm-gray-700 hover:bg-warm-gray-50 transition-colors"
                    >
                      <item.icon size={16} className="text-warm-gray-400" />
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Settings */}
                <div className="py-1">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center min-h-11 gap-2.5 px-4 py-2 text-sm text-warm-gray-700 hover:bg-warm-gray-50 transition-colors"
                  >
                    <Settings size={16} className="text-warm-gray-400" />
                    Settings
                  </Link>
                </div>

                {/* Sign out */}
                <div className="border-t border-warm-gray-100 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center min-h-11 gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

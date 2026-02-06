"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  LogOut,
  ChevronDown,
  User,
  Shield,
  Briefcase,
  FolderKanban,
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
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
];

export function DashboardNav({ user, isAdmin = false }: DashboardNavProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  let allNavItems = [...navItems];
  if (isAdmin) {
    allNavItems = [...allNavItems, { href: "/dashboard/admin", label: "Admin", icon: Shield }];
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-4">
      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-1">
        {allNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-warm-gray-600 hover:text-warm-gray-900 hover:bg-warm-gray-50 rounded-[--radius-md] transition-colors relative"
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-warm-gray-700 hover:bg-warm-gray-50 rounded-[--radius-md] transition-colors"
        >
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white text-sm font-medium">
              {user.name?.charAt(0) || "U"}
            </div>
          )}
          <span className="hidden sm:inline">{user.name}</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
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
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-[--radius-lg] shadow-lg border border-warm-gray-200 py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-warm-gray-100">
                  <p className="text-sm font-medium text-warm-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-warm-gray-500">{user.email}</p>
                </div>

                {/* Mobile nav items */}
                <div className="md:hidden py-2 border-b border-warm-gray-100">
                  {allNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-warm-gray-700 hover:bg-warm-gray-50 transition-colors"
                    >
                      <item.icon size={16} />
                      {item.label}
                    </Link>
                  ))}
                </div>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-warm-gray-700 hover:bg-warm-gray-50 transition-colors"
                >
                  <User size={16} />
                  Settings
                </Link>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

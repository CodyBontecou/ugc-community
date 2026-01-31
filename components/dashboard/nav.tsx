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
  Settings,
  MessageCircle,
} from "lucide-react";
import { signOut } from "@/lib/auth/client";
import type { UserRole } from "@/lib/roles";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UnreadBadge } from "@/components/messages/UnreadBadge";
import { useUnreadCount } from "@/lib/hooks/use-unread-count";

interface DashboardNavProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  isAdmin?: boolean;
  role?: UserRole;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle, showBadge: true },
];

export function DashboardNav({ user, isAdmin = false, role = "creator" }: DashboardNavProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useUnreadCount();

  const allNavItems = isAdmin
    ? [...navItems, { href: "/dashboard/admin", label: "Admin", icon: Shield }]
    : navItems;

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
            {"showBadge" in item && item.showBadge && unreadCount > 0 && (
              <UnreadBadge count={unreadCount} className="absolute -top-1 -right-1" />
            )}
          </Link>
        ))}
      </nav>

      {/* Notification Bell */}
      <NotificationBell />

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
                  href="/dashboard/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-warm-gray-700 hover:bg-warm-gray-50 transition-colors"
                >
                  <User size={16} />
                  View Profile
                </Link>

                {role === "brand" && (
                  <Link
                    href="/dashboard/brand-settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-warm-gray-700 hover:bg-warm-gray-50 transition-colors"
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                )}

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

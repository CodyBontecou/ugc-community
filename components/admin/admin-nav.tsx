"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Mail } from "lucide-react";

const tabs = [
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/invites", label: "Invites", icon: Mail },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 bg-warm-gray-100 p-1 rounded-[--radius-lg] w-fit">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[--radius-md] transition-colors ${
              isActive
                ? "bg-white text-warm-gray-900 shadow-sm"
                : "text-warm-gray-600 hover:text-warm-gray-900"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

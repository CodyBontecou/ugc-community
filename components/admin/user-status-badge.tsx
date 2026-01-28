import type { UserStatus } from "@/lib/admin";

interface UserStatusBadgeProps {
  status: UserStatus;
}

const statusStyles: Record<UserStatus, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-amber-100 text-amber-700",
  banned: "bg-red-100 text-red-700",
};

const statusLabels: Record<UserStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  banned: "Banned",
};

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

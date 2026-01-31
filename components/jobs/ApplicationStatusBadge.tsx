"use client";

import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  type ApplicationStatus,
} from "@/lib/jobs/constants";

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function ApplicationStatusBadge({ status, className = "" }: ApplicationStatusBadgeProps) {
  const colors = APPLICATION_STATUS_COLORS[status] || APPLICATION_STATUS_COLORS.interested;
  const label = APPLICATION_STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${colors.bg} ${colors.text} ${className}`}
    >
      {label}
    </span>
  );
}

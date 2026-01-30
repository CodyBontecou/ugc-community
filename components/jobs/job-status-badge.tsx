"use client";

import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/jobs/constants";

interface JobStatusBadgeProps {
  status: JobStatus;
}

const statusStyles: Record<JobStatus, string> = {
  draft: "bg-warm-gray-100 text-warm-gray-600",
  pending_review: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  closed: "bg-red-100 text-red-700",
};

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.draft}`}
    >
      {JOB_STATUS_LABELS[status] || status}
    </span>
  );
}

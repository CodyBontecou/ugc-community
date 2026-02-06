"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Clock } from "lucide-react";
import {
  COMPENSATION_TYPE_LABELS,
  PLATFORM_LABELS,
  NICHE_LABELS,
  type CompensationType,
  type Platform,
  type Niche,
} from "@/lib/jobs/constants";
// Apply button removed - jobs are now automated via hook matching

export interface JobRow {
  id: string;
  title: string;
  description: string;
  compensationType: string;
  compensationDetails: string | null;
  niches: string[] | null;
  platforms: string[] | null;
  isFeatured: boolean;
  deadlineAt: string | null;
  publishedAt: string | null;
}

interface JobTableProps {
  jobs: JobRow[];
  isLoading?: boolean;
  onApply?: (jobId: string) => void;
}

export function JobTable({ jobs, isLoading = false, onApply }: JobTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-warm-gray-100" />
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-20 border-t border-warm-gray-100 flex items-center px-4"
            >
              <div className="h-4 bg-warm-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-warm-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLink size={28} className="text-warm-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-warm-gray-900 mb-2">
          No jobs found
        </h3>
        <p className="text-warm-gray-500">
          Try adjusting your filters or check back later for new opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-warm-gray-50 border-b border-warm-gray-200">
              <th className="text-left text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3">
                Job
              </th>
              <th className="text-left text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                Compensation
              </th>
              <th className="text-left text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                Platforms
              </th>
              <th className="text-left text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                Posted
              </th>
              <th className="text-right text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-gray-100">
            {jobs.map((job) => (
              <tr
                key={job.id}
                className={`hover:bg-warm-gray-50 transition-colors ${
                  job.isFeatured ? "bg-gradient-to-r from-coral/5 to-transparent" : ""
                }`}
              >
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="font-medium text-warm-gray-900 hover:text-coral transition-colors flex items-center gap-2"
                    >
                      {job.title}
                      {job.isFeatured && (
                        <span className="text-xs bg-coral/10 text-coral px-2 py-0.5 rounded-full">
                          Featured
                        </span>
                      )}
                    </Link>
                    <p className="text-sm text-warm-gray-500 line-clamp-1">
                      {job.description}
                    </p>
                    {/* Mobile: Show compensation inline */}
                    <div className="md:hidden mt-1">
                      <span className="text-xs bg-warm-gray-100 text-warm-gray-600 px-2 py-0.5 rounded-full">
                        {COMPENSATION_TYPE_LABELS[job.compensationType as CompensationType] ||
                          job.compensationType}
                      </span>
                    </div>
                    {/* Niches */}
                    {job.niches && job.niches.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.niches.slice(0, 3).map((niche) => (
                          <span
                            key={niche}
                            className="text-xs bg-lavender/10 text-lavender px-2 py-0.5 rounded-full"
                          >
                            {NICHE_LABELS[niche as Niche] || niche}
                          </span>
                        ))}
                        {job.niches.length > 3 && (
                          <span className="text-xs text-warm-gray-400">
                            +{job.niches.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-warm-gray-900">
                      {COMPENSATION_TYPE_LABELS[job.compensationType as CompensationType] ||
                        job.compensationType}
                    </span>
                    {job.compensationDetails && (
                      <span className="text-xs text-warm-gray-500">
                        {job.compensationDetails}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {job.platforms?.map((platform) => (
                      <span
                        key={platform}
                        className="text-xs bg-warm-gray-100 text-warm-gray-600 px-2 py-0.5 rounded-full"
                      >
                        {PLATFORM_LABELS[platform as Platform] || platform}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-warm-gray-600">
                      {job.publishedAt
                        ? formatDistanceToNow(new Date(job.publishedAt), {
                            addSuffix: true,
                          })
                        : "Recently"}
                    </span>
                    {job.deadlineAt && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <Clock size={12} />
                        Deadline:{" "}
                        {new Date(job.deadlineAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="text-sm text-coral hover:text-coral/80 font-medium"
                  >
                    View Hooks →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

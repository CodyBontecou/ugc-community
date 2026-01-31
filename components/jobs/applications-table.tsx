"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, ArrowRight, MessageSquare } from "lucide-react";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import {
  COMPENSATION_TYPE_LABELS,
  type CompensationType,
  type ApplicationStatus,
} from "@/lib/jobs/constants";

export interface ApplicationRow {
  id: string;
  jobId: string;
  status: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    description: string;
    compensationType: string;
    compensationDetails: string | null;
    status: string;
    brand: {
      id: string;
      name: string | null;
      displayName: string | null;
      image: string | null;
    } | null;
  };
  unreadMessageCount: number;
}

interface ApplicationsTableProps {
  applications: ApplicationRow[];
  isLoading?: boolean;
}

export function ApplicationsTable({
  applications,
  isLoading = false,
}: ApplicationsTableProps) {
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

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-warm-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLink size={28} className="text-warm-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-warm-gray-900 mb-2">
          No applications found
        </h3>
        <p className="text-warm-gray-500">
          Try adjusting your filters or browse jobs to find new opportunities.
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
                Brand
              </th>
              <th className="text-left text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3">
                Status
              </th>
              <th className="text-left text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                Applied
              </th>
              <th className="text-right text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-gray-100">
            {applications.map((application) => {
              const brandName =
                application.job.brand?.displayName ||
                application.job.brand?.name ||
                "Unknown Brand";

              return (
                <tr
                  key={application.id}
                  className="hover:bg-warm-gray-50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-warm-gray-900">
                        {application.job.title}
                      </span>
                      <p className="text-sm text-warm-gray-500 line-clamp-1">
                        {application.job.description}
                      </p>
                      {/* Mobile: Show brand inline */}
                      <div className="md:hidden mt-1">
                        <span className="text-xs text-warm-gray-600">
                          {brandName}
                        </span>
                      </div>
                      {/* Compensation badge */}
                      <span className="inline-flex w-fit text-xs bg-warm-gray-100 text-warm-gray-600 px-2 py-0.5 rounded-full">
                        {COMPENSATION_TYPE_LABELS[
                          application.job.compensationType as CompensationType
                        ] || application.job.compensationType}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-sm text-warm-gray-700">
                      {brandName}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <ApplicationStatusBadge
                        status={application.status as ApplicationStatus}
                      />
                      {application.unreadMessageCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-white bg-coral rounded-full">
                          <MessageSquare size={10} />
                          {application.unreadMessageCount}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <span className="text-sm text-warm-gray-600">
                      {formatDistanceToNow(new Date(application.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/dashboard/applications/${application.id}`}
                      className="inline-flex items-center gap-1 text-sm text-coral hover:text-coral/80 transition-colors font-medium"
                    >
                      View
                      <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

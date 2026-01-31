"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Briefcase, ArrowRight } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/jobs/ApplicationStatusBadge";
import type { ApplicationStatus } from "@/lib/jobs/constants";

interface Application {
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

export default function CreatorApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApplications() {
      try {
        const response = await fetch("/api/applications");
        if (response.ok) {
          const data = await response.json();
          setApplications(data.applications);
        } else {
          setError("Failed to load applications");
        }
      } catch (err) {
        console.error("Error fetching applications:", err);
        setError("Failed to load applications");
      } finally {
        setIsLoading(false);
      }
    }
    fetchApplications();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            My Applications
          </h1>
          <p className="text-warm-gray-600 mt-1">
            Track the status of jobs you&apos;ve expressed interest in
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            My Applications
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-[--radius-lg] p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
          My Applications
        </h1>
        <p className="text-warm-gray-600 mt-1">
          Track the status of jobs you&apos;ve expressed interest in
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-warm-gray-50 flex items-center justify-center mb-4">
            <Briefcase size={32} className="text-warm-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-warm-gray-900 mb-2">No applications yet</h3>
          <p className="text-warm-gray-600 mb-6">
            Browse available jobs and express your interest to start collaborating with brands.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-coral hover:bg-coral/90 rounded-full transition-colors"
          >
            Browse Jobs
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 divide-y divide-warm-gray-100">
          {applications.map((application) => {
            const brandName =
              application.job.brand?.displayName ||
              application.job.brand?.name ||
              "Unknown Brand";

            return (
              <Link
                key={application.id}
                href={`/dashboard/applications/${application.id}`}
                className="block p-4 hover:bg-warm-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium text-warm-gray-900">
                        {application.job.title}
                      </h3>
                      <ApplicationStatusBadge
                        status={application.status as ApplicationStatus}
                      />
                      {application.unreadMessageCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium text-white bg-coral rounded-full">
                          {application.unreadMessageCount} new
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-warm-gray-600">{brandName}</p>
                    <p className="text-xs text-warm-gray-400 mt-2">
                      Applied{" "}
                      {formatDistanceToNow(new Date(application.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <ArrowRight size={20} className="text-warm-gray-300 flex-shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { JobForm } from "@/components/jobs/job-form";

interface JobLimits {
  used: number;
  max: number;
  remaining: number;
}

export default function NewBrandJobPage() {
  const [limits, setLimits] = useState<JobLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLimits() {
      try {
        const response = await fetch("/api/brand/jobs?limit=0");
        if (response.ok) {
          const data = await response.json();
          setLimits(data.limits);
        } else if (response.status === 403) {
          setError("Brand access required");
        }
      } catch (err) {
        console.error("Error fetching limits:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLimits();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/brand-jobs"
            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Post New Job
          </h1>
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
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/brand-jobs"
            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Post New Job
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-[--radius-lg] p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (limits && limits.remaining <= 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/brand-jobs"
            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Post New Job
          </h1>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-[--radius-lg] p-6">
          <h2 className="text-lg font-semibold text-amber-800 mb-2">Job Limit Reached</h2>
          <p className="text-amber-700">
            You have reached the maximum of {limits.max} jobs. Please close or delete existing jobs before creating new ones.
          </p>
          <Link
            href="/dashboard/brand-jobs"
            className="inline-block mt-4 px-4 py-2 bg-amber-600 text-white font-medium rounded-[--radius-md] hover:bg-amber-700 transition-colors"
          >
            Manage Your Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/brand-jobs"
            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Post New Job
          </h1>
        </div>
        {limits && (
          <div className="text-sm text-warm-gray-500">
            {limits.used} of {limits.max} jobs used
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-[--radius-lg] p-4 mb-6">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> All job postings require admin approval before they become visible to creators.
          You can save as a draft and submit for review when ready.
        </p>
      </div>

      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <JobForm mode="create" context="brand" />
      </div>
    </div>
  );
}

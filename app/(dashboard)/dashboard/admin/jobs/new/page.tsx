import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JobForm } from "@/components/jobs/job-form";

export default function NewJobPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/admin/jobs"
          className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Back to Jobs
        </Link>
        <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
          Create New Job
        </h1>
        <p className="text-warm-gray-500 mt-1">
          Create a content opportunity for creators
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <JobForm mode="create" />
      </div>
    </div>
  );
}

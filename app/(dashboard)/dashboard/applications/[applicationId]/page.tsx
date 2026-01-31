"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Loader2, ExternalLink, Briefcase } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/jobs/ApplicationStatusBadge";
import { ApplicationMessageThread } from "@/components/jobs/ApplicationMessageThread";
import type { ApplicationStatus } from "@/lib/jobs/constants";
import { COMPENSATION_TYPE_LABELS, type CompensationType } from "@/lib/jobs/constants";

interface Message {
  id: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    displayName: string | null;
    image: string | null;
  };
}

interface ApplicationData {
  application: {
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
      hooks: string[];
      compensationType: string;
      compensationDetails: string | null;
      status: string;
      deadlineAt: string | null;
      brand: {
        id: string;
        name: string | null;
        displayName: string | null;
        image: string | null;
      } | null;
    };
  };
  messages: Message[];
  currentUserId: string;
}

export default function CreatorApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = use(params);
  const [data, setData] = useState<ApplicationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApplication() {
      try {
        const response = await fetch(`/api/applications/${applicationId}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else if (response.status === 404) {
          setError("Application not found");
        } else if (response.status === 403) {
          setError("You don't have access to this application");
        } else {
          setError("Failed to load application");
        }
      } catch (err) {
        console.error("Error fetching application:", err);
        setError("Failed to load application");
      } finally {
        setIsLoading(false);
      }
    }
    fetchApplication();
  }, [applicationId]);

  const handleSendMessage = async (message: string) => {
    const response = await fetch(`/api/applications/${applicationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (response.ok) {
      const result = await response.json();
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, result.message],
        };
      });
    } else {
      throw new Error("Failed to send message");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/applications"
            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Application Details
          </h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/applications"
            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Application Details
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-[--radius-lg] p-4">
          <p className="text-red-700">{error || "Application not found"}</p>
        </div>
      </div>
    );
  }

  const { application, messages, currentUserId } = data;
  const brandName =
    application.job.brand?.displayName ||
    application.job.brand?.name ||
    "Unknown Brand";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/applications"
          className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
              {application.job.title}
            </h1>
            <ApplicationStatusBadge status={application.status as ApplicationStatus} />
          </div>
          <p className="text-warm-gray-600 mt-1">
            {brandName} &middot; Applied{" "}
            {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Status-specific messages */}
      {application.status === "accepted" && (
        <div className="bg-green-50 border border-green-200 rounded-[--radius-lg] p-4">
          <p className="text-sm text-green-700">
            <strong>Congratulations!</strong> {brandName} has accepted your application. Check the messages below for next steps.
          </p>
        </div>
      )}

      {application.status === "rejected" && (
        <div className="bg-warm-gray-50 border border-warm-gray-200 rounded-[--radius-lg] p-4">
          <p className="text-sm text-warm-gray-600">
            {brandName} has decided to go in a different direction for this opportunity. Keep applying to other jobs!
          </p>
        </div>
      )}

      {application.status === "info_requested" && (
        <div className="bg-amber-50 border border-amber-200 rounded-[--radius-lg] p-4">
          <p className="text-sm text-amber-700">
            <strong>Action needed:</strong> {brandName} has requested more information. Please respond in the messages below.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Details */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6 space-y-4 sticky top-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warm-gray-100 flex items-center justify-center">
                <Briefcase size={20} className="text-warm-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-warm-gray-900">Job Details</h3>
                <p className="text-xs text-warm-gray-500">
                  {application.job.status === "active" ? "Accepting applications" : application.job.status}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-warm-gray-500 uppercase tracking-wide mb-1">
                Description
              </h4>
              <p className="text-sm text-warm-gray-700 whitespace-pre-wrap line-clamp-4">
                {application.job.description}
              </p>
              <Link
                href={`/jobs/${application.job.id}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-coral hover:underline mt-2"
              >
                View full job
                <ExternalLink size={12} />
              </Link>
            </div>

            {application.job.hooks && application.job.hooks.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-warm-gray-500 uppercase tracking-wide mb-2">
                  Video Ideas
                </h4>
                <ul className="space-y-1">
                  {application.job.hooks.slice(0, 3).map((hook, i) => (
                    <li key={i} className="text-sm text-warm-gray-700 flex items-start gap-2">
                      <span className="text-coral mt-1">•</span>
                      <span className="line-clamp-2">{hook}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-xs font-medium text-warm-gray-500 uppercase tracking-wide mb-1">
                Compensation
              </h4>
              <p className="text-sm text-warm-gray-700">
                {COMPENSATION_TYPE_LABELS[application.job.compensationType as CompensationType] ||
                  application.job.compensationType}
                {application.job.compensationDetails && (
                  <span className="text-warm-gray-500">
                    {" "}&mdash; {application.job.compensationDetails}
                  </span>
                )}
              </p>
            </div>

            {application.job.deadlineAt && (
              <div>
                <h4 className="text-xs font-medium text-warm-gray-500 uppercase tracking-wide mb-1">
                  Deadline
                </h4>
                <p className="text-sm text-warm-gray-700">
                  {new Date(application.job.deadlineAt).toLocaleDateString()}
                </p>
              </div>
            )}

            {application.note && (
              <div>
                <h4 className="text-xs font-medium text-warm-gray-500 uppercase tracking-wide mb-1">
                  Your Note
                </h4>
                <p className="text-sm text-warm-gray-700 bg-warm-gray-50 rounded-[--radius-md] p-2">
                  {application.note}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-warm-gray-100">
              <h3 className="font-medium text-warm-gray-900">Messages</h3>
              <p className="text-xs text-warm-gray-500">
                Communicate directly with {brandName}
              </p>
            </div>
            <ApplicationMessageThread
              applicationId={applicationId}
              currentUserId={currentUserId}
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { formatDistanceToNow, format } from "date-fns";
import {
  Calendar,
  Clock,
  DollarSign,
  Eye,
  Lightbulb,
} from "lucide-react";
import {
  COMPENSATION_TYPE_LABELS,
  COMPENSATION_TYPE_DESCRIPTIONS,
  PLATFORM_LABELS,
  NICHE_LABELS,
  type CompensationType,
  type Platform,
  type Niche,
} from "@/lib/jobs/constants";
// Apply button removed - jobs are now automated via hook matching

interface JobDetailProps {
  job: {
    id: string;
    title: string;
    description: string;
    hooks: string[] | null;
    compensationType: string;
    compensationDetails: string | null;
    niches: string[] | null;
    platforms: string[] | null;
    isFeatured: boolean;
    deadlineAt: string | null;
    viewCount: number;
    publishedAt: string | null;
  };
}

export function JobDetail({ job }: JobDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {job.isFeatured && (
              <span className="text-xs bg-coral/10 text-coral px-2 py-0.5 rounded-full font-medium">
                Featured
              </span>
            )}
            {job.deadlineAt && new Date(job.deadlineAt) > new Date() && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Clock size={12} />
                Deadline: {format(new Date(job.deadlineAt), "MMM d, yyyy")}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-display)] text-warm-gray-900">
            {job.title}
          </h1>
          <p className="text-warm-gray-500 mt-1">
            Posted{" "}
            {job.publishedAt
              ? formatDistanceToNow(new Date(job.publishedAt), {
                  addSuffix: true,
                })
              : "recently"}
          </p>
        </div>

        {/* Jobs are automated - no apply button needed */}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 text-sm text-warm-gray-600">
        <span className="flex items-center gap-1">
          <Eye size={16} className="text-warm-gray-400" />
          {job.viewCount} views
        </span>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
            <h2 className="text-lg font-semibold text-warm-gray-900 mb-4">
              Description
            </h2>
            <div className="prose prose-warm-gray max-w-none">
              <p className="text-warm-gray-700 whitespace-pre-wrap">
                {job.description}
              </p>
            </div>
          </div>

          {/* Video Hooks/Ideas */}
          {job.hooks && job.hooks.length > 0 && (
            <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
              <h2 className="text-lg font-semibold text-warm-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb size={20} className="text-amber-500" />
                Video Ideas / Hooks
              </h2>
              <ul className="space-y-2">
                {job.hooks.map((hook, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-warm-gray-700"
                  >
                    <span className="text-coral font-medium">{index + 1}.</span>
                    <span>{hook}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Compensation */}
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
            <h2 className="text-lg font-semibold text-warm-gray-900 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-green-600" />
              Compensation
            </h2>
            <div className="space-y-2">
              <p className="font-medium text-warm-gray-900">
                {COMPENSATION_TYPE_LABELS[job.compensationType as CompensationType] ||
                  job.compensationType}
              </p>
              <p className="text-sm text-warm-gray-500">
                {COMPENSATION_TYPE_DESCRIPTIONS[job.compensationType as CompensationType]}
              </p>
              {job.compensationDetails && (
                <p className="text-sm text-warm-gray-700 mt-2 pt-2 border-t border-warm-gray-100">
                  {job.compensationDetails}
                </p>
              )}
            </div>
          </div>

          {/* Platforms */}
          {job.platforms && job.platforms.length > 0 && (
            <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
              <h2 className="text-lg font-semibold text-warm-gray-900 mb-4">
                Platforms
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="px-3 py-1 bg-warm-gray-100 text-warm-gray-700 rounded-full text-sm font-medium"
                  >
                    {PLATFORM_LABELS[platform as Platform] || platform}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Niches */}
          {job.niches && job.niches.length > 0 && (
            <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
              <h2 className="text-lg font-semibold text-warm-gray-900 mb-4">
                Niches
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.niches.map((niche) => (
                  <span
                    key={niche}
                    className="px-3 py-1 bg-warm-gray-100 text-warm-gray-700 rounded-full text-sm font-medium"
                  >
                    {NICHE_LABELS[niche as Niche] || niche}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Deadline */}
          {job.deadlineAt && (
            <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
              <h2 className="text-lg font-semibold text-warm-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-warm-gray-400" />
                Deadline
              </h2>
              <p className="text-warm-gray-700">
                {format(new Date(job.deadlineAt), "MMMM d, yyyy")}
              </p>
              {new Date(job.deadlineAt) > new Date() && (
                <p className="text-sm text-amber-600 mt-1">
                  {formatDistanceToNow(new Date(job.deadlineAt), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

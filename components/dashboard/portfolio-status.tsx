"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import type { PortfolioStatus as PortfolioStatusType } from "@/lib/types/analytics";

function ProgressBar({ current, target }: { current: number; target: number }) {
  const percentage = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;

  return (
    <div className="w-full bg-warm-gray-100 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          isComplete
            ? "bg-gradient-to-r from-mint to-emerald-500"
            : "bg-gradient-to-r from-coral to-rose"
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function PortfolioStatus() {
  const [status, setStatus] = useState<PortfolioStatusType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch("/api/user/portfolio-status");
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-warm-gray-200 rounded w-1/3" />
          <div className="h-4 bg-warm-gray-100 rounded-full" />
          <div className="h-16 bg-warm-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const getDaysRemainingInMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate() - now.getDate();
  };

  const daysRemaining = getDaysRemainingInMonth();
  const postsNeeded = Math.max(0, status.requiredPostCount - status.monthlyPostCount);

  // Format expiry date if exists
  const formatExpiryDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 p-6">
      <h2 className="text-lg font-semibold text-warm-gray-900 mb-4 flex items-center gap-2">
        <Globe size={20} className="text-mint" />
        Portfolio Hosting Status
      </h2>

      {/* Hosting Reward Badge - if user has it */}
      {status.hasHostingReward && (
        <div className="mb-4 p-4 rounded-lg bg-mint-soft/10 border border-mint/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-mint" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-mint">
                  Free Hosting Unlocked
                </h3>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-mint/20 text-mint">
                  <CheckCircle2 size={12} />
                  Active
                </span>
              </div>
              <p className="text-sm text-warm-gray-600 mt-1">
                Your portfolio is hosted for free as a milestone reward.
              </p>
              {status.hostingRewardExpiry && (
                <p className="text-xs text-warm-gray-500 mt-2 flex items-center gap-1">
                  <Clock size={12} />
                  Valid until {formatExpiryDate(status.hostingRewardExpiry)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Posting Progress - only show if no hosting reward */}
      {!status.hasHostingReward && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-warm-gray-500" />
              <span className="text-sm text-warm-gray-600">
                Monthly Posts for Free Hosting
              </span>
            </div>
            <span className="shrink-0 text-sm font-medium text-warm-gray-900">
              {status.monthlyPostCount} / {status.requiredPostCount}
            </span>
          </div>

          <ProgressBar
            current={status.monthlyPostCount}
            target={status.requiredPostCount}
          />

          {/* Status message */}
          {status.reason === "posting_requirement_met" ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-mint-soft/10 border border-mint/20">
              <CheckCircle2 size={18} className="text-mint flex-shrink-0 mt-0.5" />
              <div>
                <p className="shrink-0 text-sm font-medium text-warm-gray-900">
                  Requirement Met
                </p>
                <p className="text-xs text-warm-gray-600">
                  Your portfolio hosting is active this month.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle
                size={18}
                className="text-amber-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="shrink-0 text-sm font-medium text-warm-gray-900">
                  {postsNeeded} more {postsNeeded === 1 ? "post" : "posts"} needed
                </p>
                <p className="text-xs text-warm-gray-600">
                  Post {postsNeeded} more time{postsNeeded !== 1 ? "s" : ""} this
                  month to keep your portfolio active.{" "}
                  <span className="font-medium text-amber-700">
                    {daysRemaining} days remaining.
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Status Summary */}
      <div className="mt-4 pt-4 border-t border-warm-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-warm-gray-600">Portfolio Status</span>
          {status.isActive ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-mint">
              <CheckCircle2 size={16} />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600">
              <AlertTriangle size={16} />
              Inactive
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

type PortfolioStatusData = {
  isActive: boolean;
  reason: "hosting_reward" | "default_active";
  hasHostingReward: boolean;
  hostingRewardExpiry: string | null;
};

export function PortfolioStatus() {
  const [status, setStatus] = useState<PortfolioStatusData | null>(null);
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
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-warm-gray-200 rounded w-1/3" />
          <div className="h-16 bg-warm-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

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
    <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
      <h2 className="text-lg font-semibold text-warm-gray-900 mb-4 flex items-center gap-2">
        <Globe size={20} className="text-mint" />
        Portfolio Hosting Status
      </h2>

      {/* Hosting Reward Badge - if user has it */}
      {status.hasHostingReward ? (
        <div className="p-4 rounded-lg bg-mint-soft/10 border border-mint/20">
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
      ) : (
        /* Default active status */
        <div className="p-4 rounded-lg bg-mint-soft/10 border border-mint/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={20} className="text-mint" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-mint">
                  Portfolio Active
                </h3>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-mint/20 text-mint">
                  <CheckCircle2 size={12} />
                  Active
                </span>
              </div>
              <p className="text-sm text-warm-gray-600 mt-1">
                Your portfolio is live and accessible to visitors.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

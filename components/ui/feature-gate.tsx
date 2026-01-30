"use client";

import { Lock, Trophy } from "lucide-react";
import Link from "next/link";

interface FeatureGateProps {
  unlocked: boolean;
  unlockRequirement: string;
  children: React.ReactNode;
  className?: string;
  showTeaser?: boolean;
}

export function FeatureGate({
  unlocked,
  unlockRequirement,
  children,
  className = "",
  showTeaser = true,
}: FeatureGateProps) {
  if (unlocked) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Blurred/faded content teaser */}
      {showTeaser && (
        <div
          className="opacity-30 grayscale pointer-events-none select-none"
          aria-hidden="true"
        >
          {children}
        </div>
      )}

      {/* Lock overlay */}
      <div
        className={`${
          showTeaser ? "absolute inset-0" : ""
        } flex items-center justify-center`}
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-warm-gray-200 p-6 text-center max-w-xs shadow-sm">
          <div className="w-12 h-12 rounded-full bg-lavender-soft/30 flex items-center justify-center mx-auto mb-3">
            <Lock size={24} className="text-lavender" />
          </div>
          <h3 className="font-semibold text-warm-gray-900 mb-1">
            Feature Locked
          </h3>
          <p className="text-sm text-warm-gray-600 mb-4">{unlockRequirement}</p>
          <Link
            href="#milestone-progress"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-coral hover:text-coral/80 transition-colors"
          >
            <Trophy size={14} />
            View Milestones
          </Link>
        </div>
      </div>
    </div>
  );
}

interface FeatureGateBadgeProps {
  unlocked: boolean;
  unlockRequirement: string;
  size?: "sm" | "md";
}

export function FeatureGateBadge({
  unlocked,
  unlockRequirement,
  size = "md",
}: FeatureGateBadgeProps) {
  if (unlocked) return null;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-warm-gray-100 text-warm-gray-500 ${sizeClasses[size]}`}
      title={unlockRequirement}
    >
      <Lock size={size === "sm" ? 10 : 12} />
      Locked
    </span>
  );
}

interface LockedButtonProps {
  unlockRequirement: string;
  children: React.ReactNode;
  className?: string;
}

export function LockedButton({
  unlockRequirement,
  children,
  className = "",
}: LockedButtonProps) {
  return (
    <button
      disabled
      className={`relative opacity-50 cursor-not-allowed ${className}`}
      title={unlockRequirement}
    >
      <span className="flex items-center gap-2">
        {children}
        <Lock size={14} className="text-warm-gray-400" />
      </span>
    </button>
  );
}

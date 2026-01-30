import { BadgeCheck, Star, TrendingUp } from "lucide-react";

interface VerifiedBadgeProps {
  isVerified?: boolean;
  isFeatured?: boolean;
  isBoosted?: boolean;
  size?: "sm" | "md";
}

export function VerifiedBadge({
  isVerified,
  isFeatured,
  isBoosted,
  size = "md",
}: VerifiedBadgeProps) {
  const iconSize = size === "sm" ? 14 : 16;

  // isBoosted includes time-limited boosts, but don't show duplicate if already featured
  const showBoosted = isBoosted && !isFeatured;

  return (
    <div className="flex items-center gap-1">
      {isVerified && (
        <span
          className="inline-flex items-center text-lavender"
          title="Verified Creator"
        >
          <BadgeCheck size={iconSize} />
        </span>
      )}
      {isFeatured && (
        <span
          className="inline-flex items-center text-coral"
          title="Featured Creator"
        >
          <Star size={iconSize} fill="currentColor" />
        </span>
      )}
      {showBoosted && (
        <span
          className="inline-flex items-center text-mint"
          title="Boosted Creator"
        >
          <TrendingUp size={iconSize} />
        </span>
      )}
    </div>
  );
}

import { BadgeCheck, Star } from "lucide-react";

interface VerifiedBadgeProps {
  isVerified?: boolean;
  isFeatured?: boolean;
  size?: "sm" | "md";
}

export function VerifiedBadge({
  isVerified,
  isFeatured,
  size = "md",
}: VerifiedBadgeProps) {
  const iconSize = size === "sm" ? 14 : 16;

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
    </div>
  );
}

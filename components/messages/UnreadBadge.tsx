"use client";

interface UnreadBadgeProps {
  count: number;
  className?: string;
}

export function UnreadBadge({ count, className = "" }: UnreadBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-coral rounded-full ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

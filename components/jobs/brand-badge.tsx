"use client";

import { Building2 } from "lucide-react";

interface BrandBadgeProps {
  brandName?: string;
}

export function BrandBadge({ brandName }: BrandBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
      <Building2 size={12} />
      {brandName || "Brand"}
    </span>
  );
}

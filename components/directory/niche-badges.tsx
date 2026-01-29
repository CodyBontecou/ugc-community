import { NICHE_LABELS, type Niche } from "@/lib/directory/constants";

interface NicheBadgesProps {
  niches: string[] | null;
  max?: number;
}

export function NicheBadges({ niches, max = 3 }: NicheBadgesProps) {
  if (!niches || niches.length === 0) return null;

  const displayNiches = niches.slice(0, max);
  const remaining = niches.length - max;

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayNiches.map((niche) => (
        <span
          key={niche}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warm-gray-100 text-warm-gray-700"
        >
          {NICHE_LABELS[niche as Niche] || niche}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warm-gray-50 text-warm-gray-500">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

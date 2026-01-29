export function CreatorCardSkeleton() {
  return (
    <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[4/3] bg-warm-gray-200" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <div className="h-5 bg-warm-gray-200 rounded w-2/3" />

        {/* Tagline */}
        <div className="space-y-1">
          <div className="h-3 bg-warm-gray-100 rounded w-full" />
          <div className="h-3 bg-warm-gray-100 rounded w-4/5" />
        </div>

        {/* Niches */}
        <div className="flex gap-1.5">
          <div className="h-5 bg-warm-gray-100 rounded-full w-16" />
          <div className="h-5 bg-warm-gray-100 rounded-full w-14" />
          <div className="h-5 bg-warm-gray-100 rounded-full w-12" />
        </div>

        {/* Footer */}
        <div className="flex justify-between">
          <div className="h-3 bg-warm-gray-100 rounded w-24" />
          <div className="h-3 bg-warm-gray-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

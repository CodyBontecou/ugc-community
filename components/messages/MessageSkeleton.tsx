"use client";

export function MessageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
        >
          <div
            className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              i % 2 === 0 ? "bg-warm-gray-100" : "bg-coral/10"
            }`}
          >
            <div className="h-3 w-20 bg-warm-gray-200 rounded animate-pulse mb-2" />
            <div className="space-y-1">
              <div className="h-3 w-48 bg-warm-gray-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-warm-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-2 w-16 bg-warm-gray-200 rounded animate-pulse mt-2 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationListSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <div className="w-12 h-12 rounded-full bg-warm-gray-200 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-warm-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-48 bg-warm-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-3 w-12 bg-warm-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

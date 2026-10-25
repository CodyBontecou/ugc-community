export default function Loading() {
  return <div role="status" aria-label="Loading analytics" className="space-y-6 motion-safe:animate-pulse"><div className="h-8 w-56 rounded-lg bg-warm-gray-200" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-32 rounded-2xl bg-warm-gray-100" />)}</div><div className="h-64 rounded-2xl bg-warm-gray-100" /></div>;
}

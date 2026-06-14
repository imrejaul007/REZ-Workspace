export default function Loading() {
  return (
    <div className="animate-pulse px-4 py-6 space-y-6 max-w-2xl mx-auto">
      {/* Search input bar skeleton */}
      <div className="h-11 bg-gray-200 rounded-xl w-full" />

      {/* 6 result card skeletons in a responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-gray-100">
            <div className="h-32 bg-gray-200 w-full" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

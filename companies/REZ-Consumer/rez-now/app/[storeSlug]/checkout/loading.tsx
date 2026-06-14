export default function Loading() {
  return (
    <div className="animate-pulse px-4 py-6 space-y-6">
      {/* Order summary section */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-lg shrink-0" />
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded w-28" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>

      <div className="h-px bg-gray-200" />

      {/* Payment method section */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 rounded w-2/5" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
            <div className="h-6 w-6 bg-gray-200 rounded-full shrink-0" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>

      {/* Button skeleton */}
      <div className="h-12 bg-gray-200 rounded-xl w-full mt-4" />
    </div>
  );
}

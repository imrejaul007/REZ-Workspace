export default function Loading() {
  return (
    <div className="animate-pulse px-4 py-6 space-y-6">
      {/* Large status badge placeholder */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-20 w-20 bg-gray-200 rounded-full" />
        <div className="h-6 bg-gray-200 rounded-full w-36" />
        <div className="h-4 bg-gray-200 rounded w-52" />
      </div>

      <div className="h-px bg-gray-200" />

      {/* Timeline with 4 steps */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-gray-200 rounded w-2/5" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-gray-200" />

      {/* Item list with 2 rows */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 rounded w-1/4" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-lg shrink-0" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

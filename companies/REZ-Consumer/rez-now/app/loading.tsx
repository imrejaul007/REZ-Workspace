export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Hero area */}
      <div className="h-48 bg-gray-200 w-full" />

      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Heading lines */}
        <div className="space-y-3">
          <div className="h-7 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>

        {/* 3 card placeholders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-gray-100">
              <div className="h-36 bg-gray-200 w-full" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

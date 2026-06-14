export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Header bar */}
      <div className="bg-gray-200 h-16 w-full mb-4" />
      <div className="px-4 space-y-4">
        {/* Logo circle + 2 text lines */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-gray-200 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>

        {/* Category pill skeletons */}
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-gray-200 rounded-full" />
          <div className="h-8 w-24 bg-gray-200 rounded-full" />
          <div className="h-8 w-16 bg-gray-200 rounded-full" />
        </div>

        {/* Menu item card skeletons (6 cards) */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-gray-100">
              <div className="h-28 bg-gray-200 w-full" />
              <div className="p-2 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

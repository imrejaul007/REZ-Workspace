export default function Loading() {
  return (
    <div className="min-h-screen bg-dark-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="h-16 bg-dark-200 rounded-lg animate-pulse" />

        {/* Metrics skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-dark-200 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="h-80 bg-dark-200 rounded-lg animate-pulse" />

        {/* Table skeleton */}
        <div className="bg-dark-200 rounded-lg overflow-hidden">
          <div className="h-12 bg-dark-300 animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-t border-dark-300 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

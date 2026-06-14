export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32" />
      </div>

      {/* Payment card skeleton */}
      <div className="px-4 pt-6 space-y-4">
        <div className="bg-white rounded-2xl px-5 py-5 text-center space-y-3 shadow-sm animate-pulse">
          {/* Logo */}
          <div className="relative w-16 h-16 rounded-xl bg-gray-200 mx-auto" />

          {/* Amount display */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
            <div className="h-8 bg-gray-200 rounded w-32 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto" />
          </div>
        </div>

        {/* Coins preview skeleton */}
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 animate-pulse">
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
        </div>

        {/* Buttons skeleton */}
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 rounded-lg w-full animate-pulse" />
          <div className="h-12 bg-gray-200 rounded-lg w-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

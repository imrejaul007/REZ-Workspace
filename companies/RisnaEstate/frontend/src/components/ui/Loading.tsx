/**
 * Loading Spinner
 */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex items-center justify-center p-4">
      <div className={`${sizeClasses[size]} border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin`} />
    </div>
  )
}

/**
 * Loading Overlay
 */
export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 z-50 flex flex-col items-center justify-center">
      <Spinner size="lg" />
      {message && <p className="mt-4 text-gray-500">{message}</p>}
    </div>
  )
}

/**
 * Skeleton Loader
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
}

/**
 * Empty State
 */
export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  onAction
}: {
  icon?: string
  title: string
  description?: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="text-center py-12">
      <span className="text-4xl mb-4 block">{icon}</span>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      {action && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          {action}
        </button>
      )}
    </div>
  )
}

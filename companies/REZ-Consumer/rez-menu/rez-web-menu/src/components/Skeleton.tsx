'use client'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200'

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

export function MenuItemSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <Skeleton variant="rectangular" className="w-full h-48" />
      <div className="p-6 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton width="75%" height={24} />
            <Skeleton width="50%" />
          </div>
          <Skeleton width={80} height={28} />
        </div>
        <Skeleton width="100%" />
        <Skeleton width="60%" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton width={80} height={20} />
          <Skeleton width={120} height={40} className="rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function TrendingSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-shrink-0 w-48 bg-white rounded-lg p-3 shadow-sm">
          <Skeleton variant="rectangular" className="w-full h-24 mb-2" />
          <Skeleton width="80%" height={20} className="mb-1" />
          <div className="flex justify-between">
            <Skeleton width={60} height={20} />
            <Skeleton width={40} height={20} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function BundleSkeleton() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4">
      <Skeleton width={200} height={24} className="mb-4" />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg p-3 space-y-2">
            <Skeleton width={150} height={20} />
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} width="100%" height={44} className="rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} width={100} height={40} className="rounded-full" />
      ))}
    </div>
  )
}

export default Skeleton

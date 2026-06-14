import { lazy } from 'react'

// Lazy load heavy dashboard components
export const LazyAdminDashboard = lazy(() => import('@/app/dashboard/admin/page'))
export const LazyRestaurantDashboard = lazy(() => import('@/app/dashboard/restaurant/page'))
export const LazyEmployeeDashboard = lazy(() => import('@/app/dashboard/employee/page'))

// Lazy load marketplace components
export const LazyMarketplace = lazy(() => import('@/app/marketplace/page'))
export const LazyMarketplaceProducts = lazy(() => import('@/app/marketplace/products/page'))
export const LazyMarketplaceCart = lazy(() => import('@/app/marketplace/cart/page'))

// Lazy load community components
export const LazyCommunity = lazy(() => import('@/app/community/page'))

// Lazy load job components
export const LazyJobs = lazy(() => import('@/app/jobs/page'))
export const LazyJobApplications = lazy(() => import('@/app/jobs/applications/page'))

// Loading component for lazy components
export function ComponentLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px] p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

// Enhanced loading for heavy pages
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading...</h2>
        <p className="text-gray-600">Please wait while we prepare your content</p>
      </div>
    </div>
  )
}
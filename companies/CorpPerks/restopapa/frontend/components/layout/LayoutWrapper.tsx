'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { Suspense, lazy } from 'react'

// Lazy load navigation for better performance
const Navigation = lazy(() => import('@/components/layout/Navigation'))

interface LayoutWrapperProps {
  children: React.ReactNode
}

function NavigationLoader() {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col animate-pulse">
      <div className="flex flex-col flex-grow bg-white shadow-lg border-r border-gray-200">
        <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="ml-2 w-32 h-6 bg-gray-200 rounded"></div>
        </div>
        <div className="flex-1 px-4 py-6 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center px-4 py-3">
              <div className="w-5 h-5 bg-gray-200 rounded mr-3"></div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { user } = useAuth()

  return (
    <>
      {user && (
        <Suspense fallback={<NavigationLoader />}>
          <Navigation user={user} />
        </Suspense>
      )}
      <main className={user ? 'lg:pl-64' : ''}>
        {children}
      </main>
    </>
  )
}
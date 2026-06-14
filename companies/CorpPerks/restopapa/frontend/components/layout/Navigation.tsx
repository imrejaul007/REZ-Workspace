'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  HomeIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  BriefcaseIcon,
  ShoppingCartIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  HeartIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'restaurant' | 'employee' | 'vendor'
  avatar?: string
  companyName?: string
}

interface NavigationProps {
  user?: User
}

const navigationItems = {
  admin: [
    { name: 'Dashboard', href: '/dashboard/admin', icon: HomeIcon },
    { name: 'Users', href: '/dashboard/admin/users', icon: UsersIcon },
    { name: 'Restaurants', href: '/dashboard/admin/restaurants', icon: BuildingStorefrontIcon },
    { name: 'Reports', href: '/dashboard/admin/reports', icon: ChartBarIcon },
    { name: 'Settings', href: '/dashboard/admin/settings', icon: CogIcon },
  ],
  restaurant: [
    { name: 'Dashboard', href: '/dashboard/restaurant', icon: HomeIcon },
    { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingCartIcon },
    { name: 'Community', href: '/community', icon: ChatBubbleLeftRightIcon },
    { name: 'Profile', href: '/profile/restaurant', icon: UserCircleIcon },
  ],
  employee: [
    { name: 'Dashboard', href: '/dashboard/employee', icon: HomeIcon },
    { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon },
    { name: 'Applications', href: '/jobs/applications', icon: DocumentTextIcon },
    { name: 'Community', href: '/community', icon: ChatBubbleLeftRightIcon },
    { name: 'Profile', href: '/profile/employee', icon: UserCircleIcon },
  ],
  vendor: [
    { name: 'Dashboard', href: '/dashboard/vendor', icon: HomeIcon },
    { name: 'Products', href: '/marketplace/products', icon: ShoppingCartIcon },
    { name: 'Orders', href: '/marketplace/orders', icon: DocumentTextIcon },
    { name: 'Analytics', href: '/marketplace/analytics', icon: ChartBarIcon },
    { name: 'Profile', href: '/profile/vendor', icon: UserCircleIcon },
  ]
}

const globalNavigation = [
  { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingCartIcon },
  { name: 'Community', href: '/community', icon: ChatBubbleLeftRightIcon },
  { name: 'Restaurants', href: '/restaurants', icon: BuildingStorefrontIcon },
]

export default function Navigation({ user }: NavigationProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications] = useState(3)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { logout, forceLogout } = useAuth()

  const currentNavItems = user ? navigationItems[user.role] : globalNavigation

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    if (logoutLoading) return
    
    const confirmed = window.confirm('Are you sure you want to log out?')
    if (!confirmed) return
    
    setLogoutLoading(true)
    
    try {
      await logout({ serverLogout: true, clearAll: false })
    } catch (error) {
      logger.error('Logout failed:', error)
      // Force logout if server logout fails
      forceLogout('Logout failed, forcing logout')
    } finally {
      setLogoutLoading(false)
    }
  }

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white shadow-lg border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">RestaurantHub</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {currentNavItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          {user && (
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <UserCircleIcon className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.companyName || user.role}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <Link
                  href="/settings"
                  className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <CogIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="w-full group flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {logoutLoading ? (
                    <div className="mr-3 h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4 text-red-500" />
                  )}
                  {logoutLoading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">RestaurantHub</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {currentNavItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          {user && (
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <UserCircleIcon className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.companyName || user.role}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setSidebarOpen(false)}
                  className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <CogIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="w-full group flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {logoutLoading ? (
                    <div className="mr-3 h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4 text-red-500" />
                  )}
                  {logoutLoading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top header */}
      <div className="lg:pl-64">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>

            {/* Search bar */}
            <div className="flex-1 max-w-2xl mx-auto lg:mx-0 lg:ml-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search jobs, restaurants, products..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                    <HeartIcon className="w-5 h-5" />
                  </button>
                  
                  <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                    <BellIcon className="w-5 h-5" />
                    {notifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {notifications}
                      </span>
                    )}
                  </Link>

                  <Link href={`/profile/${user.role}`} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <UserCircleIcon className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </Link>
                </>
              )}

              {!user && (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                    Login
                  </Link>
                  <Link href="/auth/register" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
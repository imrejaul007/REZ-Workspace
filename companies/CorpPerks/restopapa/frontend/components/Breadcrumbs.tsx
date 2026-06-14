'use client'

import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

export interface BreadcrumbItem {
  name: string
  href?: string
  current?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-2">
        {/* Home icon */}
        <li>
          <div>
            <Link 
              href="/" 
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <HomeIcon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>

        {/* Breadcrumb items */}
        {items.map((item, index) => (
          <li key={item.name}>
            <div className="flex items-center">
              <ChevronRightIcon 
                className="h-4 w-4 text-gray-300 flex-shrink-0" 
                aria-hidden="true" 
              />
              {item.current ? (
                <span 
                  className="ml-2 text-sm font-medium text-gray-500 truncate"
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href || '#'}
                  className="ml-2 text-sm font-medium text-gray-600 hover:text-gray-800 truncate transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Utility function to generate breadcrumbs from pathname
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1
    const href = '/' + segments.slice(0, index + 1).join('/')
    
    // Convert segment to readable name
    let name = segment
    
    // Handle common route patterns
    switch (segment) {
      case 'dashboard':
        name = 'Dashboard'
        break
      case 'admin':
        name = 'Admin'
        break
      case 'restaurant':
        name = 'Restaurant'
        break
      case 'employee':
        name = 'Employee'
        break
      case 'jobs':
        name = 'Jobs'
        break
      case 'profile':
        name = 'Profile'
        break
      case 'marketplace':
        name = 'Marketplace'
        break
      case 'product':
        name = 'Product'
        break
      case 'search':
        name = 'Search'
        break
      case 'settings':
        name = 'Settings'
        break
      case 'notifications':
        name = 'Notifications'
        break
      case 'messages':
        name = 'Messages'
        break
      case 'auth':
        name = 'Authentication'
        break
      case 'login':
        name = 'Login'
        break
      default:
        // Convert kebab-case or snake_case to Title Case
        name = segment
          .replace(/[-_]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        
        // Handle IDs (assumed to be numeric or alphanumeric)
        if (/^[a-zA-Z0-9]+$/.test(segment) && segments[index - 1]) {
          // This is likely an ID, use a more generic name based on parent
          const parent = segments[index - 1]
          if (parent === 'jobs') name = 'Job Details'
          else if (parent === 'profile') name = 'Profile Details'
          else if (parent === 'product') name = 'Product Details'
          else name = 'Details'
        }
    }

    breadcrumbs.push({
      name,
      href: isLast ? undefined : href,
      current: isLast
    })
  })

  return breadcrumbs
}
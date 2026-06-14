'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  Book,
  FileText,
  Code2,
  Box,
  Layers,
  Key,
  Webhook,
  Gauge,
  AlertCircle,
  GitBranch,
  ChevronRight,
} from 'lucide-react'

const sidebarSections = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Introduction', href: '/docs', icon: Book },
      { label: 'Authentication', href: '/docs/authentication', icon: Key },
      { label: 'Quick Start', href: '/docs/quick-start', icon: Code2 },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { label: 'API Overview', href: '/docs/api-overview', icon: Layers },
      { label: 'Webhooks', href: '/docs/webhooks', icon: Webhook },
      { label: 'Rate Limits', href: '/docs/rate-limits', icon: Gauge },
      { label: 'Error Codes', href: '/docs/error-codes', icon: AlertCircle },
    ],
  },
  {
    title: 'Services',
    items: [
      { label: 'Authentication Service', href: '/docs/auth', icon: Key },
      { label: 'Payment Service', href: '/docs/payments', icon: Box },
      { label: 'Order Service', href: '/docs/orders', icon: Box },
      { label: 'Catalog Service', href: '/docs/catalog', icon: Box },
      { label: 'Search Service', href: '/docs/search', icon: Box },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'SDKs', href: '/sdks', icon: Box },
      { label: 'API Reference', href: '/api-reference', icon: FileText },
      { label: 'Changelog', href: '/docs/changelog', icon: GitBranch },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 border-r border-white/10 bg-[#0a0a0f] overflow-y-auto z-40">
      <div className="p-4">
        {sidebarSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              {section.title}
            </h3>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Version Badge */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">API Version</span>
            <span className="text-xs font-mono text-indigo-400">v2.0</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

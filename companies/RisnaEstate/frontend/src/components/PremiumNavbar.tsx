/**
 * Premium Navigation Component
 */
import Link from 'next/link'
import { useState } from 'react'

interface NavbarProps {
  portal?: string
}

export default function PremiumNavbar({ portal = 'consumer' }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const consumerLinks = [
    { href: '/consumer/properties', label: 'Properties', icon: '🏠' },
    { href: '/consumer/visa', label: 'Golden Visa', icon: '🌍' },
    { href: '/consumer/calculator', label: 'Calculator', icon: '💰' },
    { href: '/consumer/bookings', label: 'Bookings', icon: '📋' },
  ]

  const links = portal === 'consumer' ? consumerLinks : []

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              RE
            </div>
            <div>
              <span className="font-display font-bold text-xl text-gray-900">Risna</span>
              <span className="font-display font-bold text-xl text-primary-600">Estate</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors font-medium"
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button className="px-4 py-2 text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Sign In
            </button>
            <button className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-slide-down">
          <div className="px-4 py-4 space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <span className="text-xl">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <button className="w-full px-4 py-3 text-center text-gray-600 hover:text-primary-600 font-medium">
                Sign In
              </button>
              <button className="w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold">
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

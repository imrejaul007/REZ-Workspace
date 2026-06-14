'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search, Menu, X, Github, Twitter } from 'lucide-react'

const navLinks = [
  { label: 'Docs', href: '/docs' },
  { label: 'API Reference', href: '/api-reference' },
  { label: 'SDKs', href: '/sdks' },
  { label: 'Playground', href: '/playground' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="h-full max-w-[1800px] mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm">
              REZ
            </div>
            <span className="font-semibold hidden sm:block">Developer Portal</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-48 placeholder:text-gray-500"
            />
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-xs text-gray-500 bg-white/5 rounded">
              /
            </kbd>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="https://github.com/imrejaul007"
              target="_blank"
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Github className="w-5 h-5" />
            </Link>
            <Link
              href="#"
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-[#0a0a0f] border-b border-white/10 p-4">
          <div className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search documentation..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-500"
              />
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

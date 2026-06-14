'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search as SearchIcon, X, FileText, Code2, Package } from 'lucide-react'

interface SearchResult {
  title: string
  description: string
  href: string
  type: 'doc' | 'api' | 'sdk'
}

const searchIndex: SearchResult[] = [
  // Documentation
  { title: 'Introduction', description: 'Learn the basics of the REZ API ecosystem', href: '/docs/introduction', type: 'doc' },
  { title: 'Authentication', description: 'Secure your API requests with JWT tokens and API keys', href: '/docs/authentication', type: 'doc' },
  { title: 'Quick Start', description: 'Make your first API call in under 5 minutes', href: '/docs/quick-start', type: 'doc' },
  { title: 'API Overview', description: 'Explore all available services and their endpoints', href: '/docs/api-overview', type: 'doc' },
  { title: 'Webhooks', description: 'Receive real-time notifications for events', href: '/docs/webhooks', type: 'doc' },
  { title: 'Rate Limits', description: 'Understand request limits and best practices', href: '/docs/rate-limits', type: 'doc' },
  { title: 'Error Codes', description: 'Reference for all API error codes', href: '/docs/error-codes', type: 'doc' },
  { title: 'Changelog', description: 'Stay updated with the latest API changes', href: '/docs/changelog', type: 'doc' },

  // API Reference
  { title: 'Auth Service', description: 'JWT, OTP, MFA, OAuth endpoints', href: '/api-reference', type: 'api' },
  { title: 'Payment Service', description: 'Razorpay, UPI, Webhooks endpoints', href: '/api-reference', type: 'api' },
  { title: 'Order Service', description: 'Order lifecycle, FSM, tracking', href: '/api-reference', type: 'api' },
  { title: 'Wallet Service', description: 'Coins, Balance, Loyalty endpoints', href: '/api-reference', type: 'api' },

  // SDKs
  { title: 'JavaScript SDK', description: '@rez/sdk for browser and Node.js', href: '/sdks', type: 'sdk' },
  { title: 'React Native SDK', description: '@rez/sdk-react-native for mobile apps', href: '/sdks', type: 'sdk' },
  { title: 'Python SDK', description: 'Community Python client library', href: '/sdks', type: 'sdk' },
]

export function Search() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    const filtered = searchIndex.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setResults(filtered)
    setSelectedIndex(0)
  }, [])

  useEffect(() => {
    handleSearch(query)
  }, [query, handleSearch])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }

      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      router.push(results[selectedIndex].href)
      setIsOpen(false)
      setQuery('')
    }
  }

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'doc':
        return <FileText className="w-4 h-4" />
      case 'api':
        return <Code2 className="w-4 h-4" />
      case 'sdk':
        return <Package className="w-4 h-4" />
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <SearchIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Search documentation...</span>
        <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-xs text-gray-500 bg-white/5 rounded">
          Ctrl+K
        </kbd>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-2xl mx-4 bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
              <SearchIcon className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyNavigation}
                placeholder="Search documentation..."
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-gray-500"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            {results.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto p-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.href}-${result.title}`}
                    onClick={() => {
                      router.push(result.href)
                      setIsOpen(false)
                      setQuery('')
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.title}</div>
                      <div className="text-sm text-gray-500 truncate">
                        {result.description}
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 capitalize">
                      {result.type}
                    </span>
                  </button>
                ))}
              </div>
            ) : query ? (
              <div className="p-8 text-center text-gray-500">
                <p>No results found for &quot;{query}&quot;</p>
              </div>
            ) : (
              <div className="p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">
                  Quick Links
                </div>
                {[
                  { title: 'Getting Started', href: '/docs' },
                  { title: 'API Reference', href: '/api-reference' },
                  { title: 'SDK Documentation', href: '/sdks' },
                  { title: 'API Playground', href: '/playground' },
                ].map((link) => (
                  <button
                    key={link.href}
                    onClick={() => {
                      router.push(link.href)
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>{link.title}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/5 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white/5 rounded">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/5 rounded">↵</kbd>
                  to select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded">esc</kbd>
                to close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

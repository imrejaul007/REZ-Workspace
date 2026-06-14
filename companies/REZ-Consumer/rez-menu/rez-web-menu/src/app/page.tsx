'use client'

import { useState, useEffect, useCallback, useMemo, useDeferredValue, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { MenuItem, CartItem } from '@/lib/services/types'
import {
  CatalogService,
  SearchService,
  IntentService,
  DemandService,
} from '@/lib/services'
import {
  SmartBadge,
  PairsWell,
  StockStatus,
  PersonalizedMenu,
  CartRecovery,
  BundleBuilder,
  CartDrawer,
} from '@/components'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MenuItemSkeleton, CategorySkeleton } from '@/components/Skeleton'
import { useCart } from '@/hooks/useCart'
import { useCartApi } from '@/hooks/useCartApi'
import { logger } from '@/lib/logger'
import { formatPrice } from '@/lib/format'
import { validateSearchQuery, sanitizeString } from '@/lib/validation'
import {
  API_TIMEOUT_MS,
  TRENDING_ITEMS_LIMIT,
  SEARCH_RESULTS_LIMIT,
  SKELETON_ITEMS_COUNT,
  SEARCH_MIN_LENGTH,
  SEARCH_MAX_LENGTH,
} from '@/lib/constants'

interface DineInContext {
  tableNumber: string
  restaurantSlug: string
  isDineIn: boolean
}

interface Category {
  id: string
  name: string
  icon: string
}

const VALID_CATEGORIES = ['all', 'starters', 'mains', 'desserts', 'drinks'] as const
type CategoryId = typeof VALID_CATEGORIES[number]

function isValidCategory(category: string): category is CategoryId {
  return VALID_CATEGORIES.includes(category as CategoryId)
}

const defaultCategories: Category[] = [
  { id: 'all', name: 'All', icon: '✨' },
  { id: 'starters', name: 'Starters', icon: '🥗' },
  { id: 'mains', name: 'Mains', icon: '🍲' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
]

const defaultMenuItems: MenuItem[] = [
  { id: '1', name: 'Caesar Salad', description: 'Fresh romaine lettuce with caesar dressing, parmesan, and croutons', price: 299, category: 'starters', available: true, rating: 4.5, images: ['https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400'] },
  { id: '2', name: 'Margherita Pizza', description: 'Classic tomato sauce, fresh mozzarella, basil', price: 399, category: 'mains', available: true, rating: 4.7, images: ['https://images.unsplash.com/photo-1604382354936-07c5d9980bd?w=400'] },
  { id: '3', name: 'Tandoori Chicken', description: 'Marinated chicken cooked in clay oven', price: 449, category: 'mains', available: true, rating: 4.8, images: ['https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400'] },
  { id: '4', name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', price: 299, category: 'desserts', available: true, rating: 4.9, images: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400'] },
  { id: '5', name: 'Fresh Lime Soda', description: 'Refreshing citrus drink with mint', price: 99, category: 'drinks', available: true, rating: 4.3, images: ['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400'] },
  { id: '6', name: 'Garlic Naan', description: 'Soft bread with garlic butter', price: 79, category: 'starters', available: true, rating: 4.6, images: ['https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400'] },
]

function MenuPageContent() {
  const searchParams = useSearchParams()
  const storeSlug = searchParams.get('store') || 'default'
  const tableNumber = searchParams.get('table')

  // State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultMenuItems)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const [showBundleBuilder, setShowBundleBuilder] = useState(false)

  const deferredQuery = useDeferredValue(searchQuery)

  // Cart state
  const {
    items: cartItems,
    itemCount: cartItemCount,
    subtotal: cartSubtotal,
    addItem: apiAddItem,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCartApi(storeSlug)

  // Dine-in context
  const dineInContext: DineInContext | null = tableNumber ? {
    tableNumber,
    restaurantSlug: storeSlug,
    isDineIn: true,
  } : null

  const userId = 'demo-user'

  // Fetch menu items
  const fetchMenuItems = useCallback(async (category: CategoryId) => {
    setLoading(true)
    setError(null)

    try {
      const items = await CatalogService.getMenuItems(storeSlug, category === 'all' ? undefined : category)
      if (items.length > 0) {
        setMenuItems(items)
      }
    } catch (err) {
      logger.error('Failed to fetch menu', { error: err })
    } finally {
      setLoading(false)
    }
  }, [storeSlug])

  useEffect(() => {
    fetchMenuItems(selectedCategory)
  }, [selectedCategory, fetchMenuItems])

  // Search
  const searchResults = useMemo(async () => {
    if (deferredQuery.length < SEARCH_MIN_LENGTH) return []
    const query = sanitizeString(deferredQuery)
    if (!validateSearchQuery(query)) return []
    try {
      return await SearchService.search(storeSlug, query, SEARCH_RESULTS_LIMIT)
    } catch {
      return []
    }
  }, [deferredQuery, storeSlug])

  // Trending items
  const trendingItems = useMemo(() => {
    return menuItems.filter(item => item.rating && item.rating >= 4.5).slice(0, TRENDING_ITEMS_LIMIT)
  }, [menuItems])

  // Handlers
  const handleCategoryChange = useCallback((category: string) => {
    if (isValidCategory(category)) {
      setSelectedCategory(category)
    }
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleItemClick = useCallback((item: MenuItem) => {
    setSelectedItem(item)
    trackIntent('view', item.id)
  }, [])

  const handleAddToOrder = useCallback((item: MenuItem) => {
    trackIntent('add_cart', item.id)
    apiAddItem({
      id: item.id,
      productId: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      quantity: 1,
      image: item.images?.[0],
    })
  }, [apiAddItem])

  const handleRestoreCart = useCallback((items: CartItem[]) => {
    items.forEach(item => {
      apiAddItem(item)
    })
  }, [apiAddItem])

  const trackIntent = (action: string, itemId: string) => {
    IntentService.trackIntent(userId, 'menu', action, itemId, { storeSlug })
  }

  const categories = defaultCategories

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return menuItems
    return menuItems.filter((item) => item.category === selectedCategory)
  }, [menuItems, selectedCategory])

  const displayItems = searchQuery.length >= SEARCH_MIN_LENGTH ? menuItems : filteredItems

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                R
              </div>
              <div>
                <h1 className="font-bold text-gray-900">ReZ Menu</h1>
                <p className="text-xs text-gray-500">Digital Ordering</p>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-2xl border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-semibold">{cartItemCount || 0}</span>
              {cartSubtotal > 0 && (
                <span className="text-sm opacity-90">• {formatPrice(cartSubtotal)}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Dine-in Banner */}
        {dineInContext && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm">
                🪑
              </div>
              <div className="flex-1">
                <p className="font-bold text-xl">Table {dineInContext.tableNumber}</p>
                <p className="opacity-90">Order will be sent directly to the kitchen</p>
              </div>
              <button className="px-4 py-2 bg-white/20 rounded-xl font-medium hover:bg-white/30 transition-colors">
                Change
              </button>
            </div>
          </div>
        )}

        {/* Hero / Promo Banner */}
        {!dineInContext && !searchQuery && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-3">
                🎉 Welcome Offer
              </span>
              <h2 className="text-3xl font-bold mb-2">Get 10% Cashback</h2>
              <p className="opacity-90 mb-4">On your first order with ReZ Coins</p>
              <div className="flex gap-3">
                <button className="px-6 py-3 bg-white text-purple-700 rounded-xl font-semibold hover:bg-opacity-90 transition-colors">
                  Order Now
                </button>
                <button className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl font-semibold hover:bg-white/30 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Categories</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Trending */}
        {!searchQuery && trendingItems.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <h2 className="text-xl font-bold text-gray-900">Trending Now</h2>
              </div>
              <span className="text-sm text-gray-500">Based on orders today</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {trendingItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="flex-shrink-0 w-56 bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all group"
                >
                  <div className="relative h-32">
                    {item.images?.[0] ? (
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl">
                        🍽️
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-lg">
                        ⭐ {item.rating}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-green-600">{formatPrice(item.price)}</span>
                      <span className="text-xs text-gray-400 capitalize">{item.category}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Search Results Header */}
        {searchQuery && (
          <div className="flex items-center gap-3 py-4 border-b border-gray-200">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Results for "{searchQuery}"</p>
              <p className="text-sm text-gray-500">{displayItems.length} items found</p>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="ml-auto px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        )}

        {/* Menu Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCategory === 'all' ? 'All Items' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            </h2>
            <span className="text-sm text-gray-500">{displayItems.length} items</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: SKELETON_ITEMS_COUNT }).map((_, i) => (
                <MenuItemSkeleton key={i} />
              ))}
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                🍽️
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500 mb-4">Try a different category or search term</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                View All Items
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayItems.map((item) => (
                <article
                  key={item.id}
                  className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    {item.images?.[0] ? (
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl">
                        🍽️
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <SmartBadge itemId={item.id} itemName={item.name} storeSlug={storeSlug} />
                      {item.rating && (
                        <span className="px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1">
                          ⭐ {item.rating}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
                    <div className="absolute top-3 right-3">
                      <StockStatus itemId={item.id} storeSlug={storeSlug} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {item.description}
                    </p>

                    {/* Dietary Tags */}
                    {item.dietaryTags && item.dietaryTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.dietaryTags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xl font-bold text-gray-900">{formatPrice(item.price)}</span>
                      <button
                        onClick={() => handleAddToOrder(item)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Bundle Builder */}
        {!searchQuery && menuItems.length >= 4 && (
          <BundleBuilder
            baseItems={menuItems}
            onBundleSelect={(items, total) => logger.info('Bundle selected', { items: Object.fromEntries(items), total })}
          />
        )}

        {/* Cart Recovery */}
        {userId && (
          <CartRecovery
            userId={userId}
            storeSlug={storeSlug}
            onRestoreCart={handleRestoreCart}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  R
                </div>
                <span className="font-bold text-xl">ReZ Menu</span>
              </div>
              <p className="text-gray-400 text-sm">
                Modern digital ordering for restaurants. Powered by AI personalization.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/menu" className="hover:text-white transition-colors">Menu</Link></li>
                <li><Link href="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
                <li><Link href="/wallet" className="hover:text-white transition-colors">ReZ Coins</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/refunds" className="hover:text-white transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 ReZ Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-gray-800 px-3 py-1 rounded-full">Powered by AI</span>
              <span className="text-xs bg-gray-800 px-3 py-1 rounded-full">Built on RABTUL</span>
              <span className="text-xs bg-gray-800 px-3 py-1 rounded-full">ReZ Intelligence</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64">
              {selectedItem.images?.[0] ? (
                <Image
                  src={selectedItem.images[0]}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-8xl">
                  🍽️
                </div>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                <span className="text-xl font-bold text-green-600">{formatPrice(selectedItem.price)}</span>
              </div>

              {selectedItem.rating && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-lg">⭐ {selectedItem.rating}</span>
                  <span className="text-sm text-gray-500">{selectedItem.category}</span>
                </div>
              )}

              <p className="text-gray-600 mb-6">{selectedItem.description}</p>

              {selectedItem.dietaryTags && selectedItem.dietaryTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedItem.dietaryTags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <PairsWell currentItem={selectedItem} storeSlug={storeSlug} />

              <button
                onClick={() => {
                  handleAddToOrder(selectedItem)
                  setSelectedItem(null)
                }}
                className="w-full mt-6 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors"
              >
                Add to Order • {formatPrice(selectedItem.price)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <button
          onClick={() => setCartDrawerOpen(true)}
          className="fixed bottom-6 right-6 flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-blue-600/30 hover:shadow-3xl transition-all z-40 group"
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-blue-600 text-xs font-bold rounded-full flex items-center justify-center">
              {cartItemCount}
            </span>
          </div>
          <div className="text-left">
            <p className="font-bold">{cartItemCount} item{cartItemCount > 1 ? 's' : ''}</p>
            <p className="text-sm opacity-90">{formatPrice(cartSubtotal)}</p>
          </div>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        items={cartItems}
        itemCount={cartItemCount}
        subtotal={cartSubtotal}
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        storeSlug={storeSlug}
      />
    </div>
  )
}

export default function MenuPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold animate-pulse">
              R
            </div>
            <p className="text-gray-500">Loading menu...</p>
          </div>
        </div>
      }>
        <MenuPageContent />
      </Suspense>
    </ErrorBoundary>
  )
}

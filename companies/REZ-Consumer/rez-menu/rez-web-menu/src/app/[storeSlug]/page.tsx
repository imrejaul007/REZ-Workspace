'use client'

/**
 * Dynamic Store Menu Page
 * Accessible via: /[storeSlug]?table=5
 *
 * This page handles:
 * - Direct store URLs: /pizza-palace
 * - QR scan URLs: /pizza-palace?table=5
 * - Table dine-in mode with kitchen integration
 */

import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
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
import { MenuItemSkeleton, TrendingSkeleton, CategorySkeleton } from '@/components/Skeleton'
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

// Types
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
  { id: 'all', name: 'All', icon: '🍽️' },
  { id: 'starters', name: 'Starters', icon: '🥗' },
  { id: 'mains', name: 'Main Course', icon: '🍲' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
]

const defaultMenuItems: MenuItem[] = [
  { id: '1', name: 'Caesar Salad', description: 'Fresh romaine lettuce with caesar dressing and croutons', price: 299, category: 'starters', available: true },
  { id: '2', name: 'Spring Rolls', description: 'Crispy vegetable spring rolls with sweet chili sauce', price: 199, category: 'starters', available: true },
  { id: '3', name: 'Grilled Salmon', description: 'Atlantic salmon with herbs and lemon butter sauce', price: 599, category: 'mains', available: true },
  { id: '4', name: 'Butter Chicken', description: 'Tender chicken in rich tomato gravy with aromatic spices', price: 349, category: 'mains', available: true },
  { id: '5', name: 'Chocolate Cake', description: 'Rich chocolate layer cake with ganache', price: 249, category: 'desserts', available: true },
  { id: '6', name: 'Tiramisu', description: 'Classic Italian coffee-flavored dessert', price: 299, category: 'desserts', available: true },
  { id: '7', name: 'Fresh Lime Soda', description: 'Refreshing lime with soda and mint', price: 99, category: 'drinks', available: true },
  { id: '8', name: 'Mango Lassi', description: 'Sweet and creamy mango yogurt drink', price: 149, category: 'drinks', available: true },
]

// Dine-in context type
interface DineInContext {
  tableNumber: string
  restaurantSlug: string
  isDineIn: boolean
}

export default function StoreMenuPage() {
  // Get params from URL
  const params = useParams()
  const searchParams = useSearchParams()
  const storeSlug = params.storeSlug as string
  const tableParam = searchParams?.get('table')

  // State
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultMenuItems)
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MenuItem[]>([])
  const [trendingItems, setTrendingItems] = useState<MenuItem[]>([])
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [showBundleBuilder, setShowBundleBuilder] = useState(false)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const [restaurantName, setRestaurantName] = useState<string>('')

  // Deferred query for debounced search
  const deferredQuery = useDeferredValue(searchQuery)

  // Dine-in context from QR scan
  const dineInContext: DineInContext | null = tableParam ? {
    tableNumber: tableParam,
    restaurantSlug: storeSlug,
    isDineIn: true,
  } : null

  // Cart state (use API cart when available)
  const {
    items: cartItems,
    itemCount: cartItemCount,
    subtotal: cartSubtotal,
    addItem: apiAddItem,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCartApi(storeSlug)

  // Data fetching
  const fetchMenuItems = useCallback(async (category: CategoryId) => {
    if (!isValidCategory(category)) {
      category = 'all'
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    if (!apiUrl) {
      logger.warn('NEXT_PUBLIC_API_URL not configured, using default menu')
      return
    }

    setLoading(true)
    setError(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

    try {
      const encodedCategory = encodeURIComponent(category)
      const response = await fetch(`${apiUrl}/menu?category=${encodedCategory}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data.items) && data.items.length > 0) {
          setMenuItems(data.items)
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name !== 'AbortError') {
        logger.error('Failed to fetch menu items', err, { category })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch restaurant info
  const fetchRestaurantInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/restaurant/${storeSlug}`)
      if (response.ok) {
        const data = await response.json()
        if (data.name) {
          setRestaurantName(data.name)
        }
      }
    } catch (err) {
      logger.warn('Could not fetch restaurant info', { error: (err as Error).message })
    }
  }, [storeSlug])

  // Fetch trending items
  const fetchTrendingItems = useCallback(async () => {
    try {
      const result = await DemandService.getTrending(storeSlug, TRENDING_ITEMS_LIMIT)
      if (result.success && result.data) {
        const trendingIds = result.data.items.map((t) => t.itemId)
        setTrendingItems((prevItems) =>
          prevItems.filter((item) => trendingIds.includes(item.id))
        )
      }
    } catch (err) {
      logger.warn('Trending service unavailable', { error: (err as Error).message })
    }
  }, [storeSlug])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const result = await CatalogService.getCategories(storeSlug)
      if (result.success && result.data && result.data.categories.length > 0) {
        const apiCategories: Category[] = result.data.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          icon: getCategoryIcon(cat.name),
        }))
        setCategories([{ id: 'all', name: 'All', icon: '🍽️' }, ...apiCategories])
      }
    } catch (err) {
      logger.warn('Using default categories', { error: (err as Error).message })
    }
  }, [storeSlug])

  // Search handler
  const handleSearch = useCallback(async (query: string) => {
    const sanitized = sanitizeString(query)
    setSearchQuery(sanitized)

    if (sanitized.length < SEARCH_MIN_LENGTH) {
      setSearchResults([])
      return
    }

    if (sanitized.length > SEARCH_MAX_LENGTH) {
      return
    }

    try {
      const result = await SearchService.search(sanitized, { limit: SEARCH_RESULTS_LIMIT })
      if (result.success && result.data) {
        setSearchResults(result.data.items)
      }
    } catch (err) {
      const localResults = menuItems.filter(
        (item) =>
          item.name.toLowerCase().includes(sanitized.toLowerCase()) ||
          item.description.toLowerCase().includes(sanitized.toLowerCase())
      )
      setSearchResults(localResults)
    }
  }, [menuItems])

  // Track user action
  const trackIntent = useCallback(async (event: string, itemId?: string) => {
    if (!userId) return

    try {
      await IntentService.captureEvent(userId, {
        type: event as 'view' | 'search' | 'add_cart' | 'checkout_start' | 'order',
        itemId,
        storeSlug,
      })
    } catch (err) {
      logger.warn('Intent tracking unavailable', { error: (err as Error).message })
    }
  }, [userId, storeSlug])

  // Effects
  useEffect(() => {
    fetchMenuItems(selectedCategory)
    fetchTrendingItems()
    fetchCategories()
    fetchRestaurantInfo()
  }, [selectedCategory, fetchMenuItems, fetchTrendingItems, fetchCategories, fetchRestaurantInfo])

  useEffect(() => {
    handleSearch(deferredQuery)
  }, [deferredQuery, handleSearch])

  // Event handlers
  const handleCategoryChange = (categoryId: string) => {
    if (isValidCategory(categoryId)) {
      setSelectedCategory(categoryId)
    }
  }

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item)
    trackIntent('view', item.id)
  }

  const handleAddToOrder = (item: MenuItem) => {
    trackIntent('add_cart', item.id)
    apiAddItem({
      id: item.id,
      productId: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      quantity: 1,
      image: item.images?.[0],
      // Include table info for dine-in orders
      ...(dineInContext && {
        metadata: {
          tableNumber: dineInContext.tableNumber,
          orderType: 'dine_in',
        },
      }),
    })
  }

  const handleRestoreCart = (items: CartItem[]) => {
    items.forEach(item => {
      apiAddItem(item)
    })
  }

  // Helper functions
  function getCategoryIcon(name: string): string {
    const icons: Record<string, string> = {
      starters: '🥗',
      mains: '🍲',
      desserts: '🍰',
      drinks: '🥤',
      appetizers: '🥟',
      main: '🍛',
      'main course': '🍛',
      beverages: '🧃',
    }
    return icons[name.toLowerCase()] || '🍽️'
  }

  // Computed values
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return menuItems
    return menuItems.filter((item) => item.category === selectedCategory)
  }, [menuItems, selectedCategory])

  const displayItems = searchQuery.length >= SEARCH_MIN_LENGTH ? searchResults : filteredItems

  // Display name
  const displayName = restaurantName || storeSlug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Our Menu'

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* DINE-IN INDICATOR (QR SCAN MODE) */}
        {dineInContext && (
          <section className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 py-4 px-4">
            <div className="max-w-2xl mx-auto flex items-center justify-center gap-3">
              <span className="text-2xl" aria-hidden="true">🪑</span>
              <div className="text-center">
                <p className="font-semibold text-green-800">
                  Dine-in at Table {dineInContext.tableNumber}
                </p>
                <p className="text-sm text-green-600">
                  Your order will be sent directly to the kitchen
                </p>
              </div>
            </div>
          </section>
        )}

        {/* HERO SECTION */}
        <section className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {displayName}
          </h1>
          <p className="text-gray-600">
            {dineInContext
              ? `Order from your table #${dineInContext.tableNumber}`
              : 'Discover our delicious offerings'
            }
          </p>

          {/* Search Bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for dishes..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search menu items"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </section>

        {/* TRENDING NOW */}
        {trendingItems.length > 0 && !searchQuery && (
          <section className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl" aria-hidden="true">🔥</span>
              <h2 className="text-xl font-bold text-gray-900">Trending Now</h2>
              <span className="text-sm text-gray-500">Based on today&apos;s orders</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {trendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-48 bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleItemClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleItemClick(item)}
                  aria-label={`View ${item.name}`}
                >
                  {item.images?.[0] && (
                    <Image
                      src={item.images[0]}
                      alt={item.name}
                      width={192}
                      height={96}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                  )}
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-green-600 font-bold">{formatPrice(item.price)}</span>
                    <SmartBadge
                      itemId={item.id}
                      itemName={item.name}
                      storeSlug={storeSlug}
                      showTrending={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CATEGORY FILTER */}
        <section
          className="flex flex-wrap justify-center gap-3"
          role="tablist"
          aria-label="Menu categories"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              role="tab"
              aria-selected={selectedCategory === category.id}
              aria-label={`Filter by ${category.name}`}
              className={`px-4 py-2 rounded-full text-lg font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
              }`}
            >
              <span className="mr-2" aria-hidden="true">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </section>

        {/* BUNDLE BUILDER */}
        {!searchQuery && menuItems.length >= 4 && (
          <BundleBuilder
            baseItems={menuItems}
            onBundleSelect={(items, total) => logger.info('Bundle selected', { items: Object.fromEntries(items), total })}
          />
        )}

        {/* CART RECOVERY */}
        {userId && (
          <CartRecovery
            userId={userId}
            storeSlug={storeSlug}
            onRestoreCart={handleRestoreCart}
          />
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(SKELETON_ITEMS_COUNT)].map((_, i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
            <span aria-hidden="true">⚠️</span>
            <span className="ml-2">{error}</span>
          </div>
        )}

        {/* MENU GRID */}
        {!loading && !error && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="tabpanel">
            {displayItems.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Item Image */}
                {item.images?.[0] ? (
                  <div className="relative">
                    <button
                      onClick={() => handleItemClick(item)}
                      className="w-full cursor-pointer"
                      aria-label={`View ${item.name}`}
                    >
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover"
                      />
                    </button>
                    <div className="absolute top-2 left-2">
                      <SmartBadge
                        itemId={item.id}
                        itemName={item.name}
                        storeSlug={storeSlug}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleItemClick(item)}
                    className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl cursor-pointer"
                    aria-label={`View ${item.name}`}
                  >
                    🍽️
                  </button>
                )}

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3
                        className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                        onClick={() => handleItemClick(item)}
                      >
                        {item.name}
                      </h3>
                      <StockStatus itemId={item.id} storeSlug={storeSlug} className="mt-1" />
                    </div>
                    <span className="text-xl font-bold text-green-600">{formatPrice(item.price)}</span>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>

                  {item.dietaryTags && item.dietaryTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.dietaryTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                        >
                          {tag === 'vegetarian' && '🌱'}
                          {tag === 'vegan' && '🌿'}
                          {tag === 'gluten-free' && '🌾'}
                          {tag === 'halal' && '🕌'}
                          {' '}{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 capitalize">{item.category}</span>
                    <button
                      type="button"
                      onClick={() => handleAddToOrder(item)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Add ${item.name} to order`}
                    >
                      Add to Order
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* EMPTY STATE */}
        {!loading && displayItems.length === 0 && (
          <div className="text-center py-12 text-gray-500" role="status">
            <span className="text-4xl mb-4 block">🍽️</span>
            <p className="text-xl">
              {searchQuery
                ? 'No items found for your search'
                : 'No items found in this category'}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="mt-4 text-blue-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* PAIRS WELL MODAL */}
        {selectedItem && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 id="modal-title" className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                {selectedItem.images?.[0] && (
                  <Image
                    src={selectedItem.images[0]}
                    alt={selectedItem.name}
                    width={400}
                    height={256}
                    className="w-full h-64 object-cover rounded-xl mb-4"
                  />
                )}

                <p className="text-gray-600 mb-4">{selectedItem.description}</p>
                <p className="text-2xl font-bold text-green-600 mb-6">
                  {formatPrice(selectedItem.price)}
                </p>

                <PairsWell
                  itemId={selectedItem.id}
                  itemName={selectedItem.name}
                  storeSlug={storeSlug}
                  onAddToCart={(pairItem) => {
                    logger.info('Pair item selected', { item: pairItem.name })
                  }}
                  className="mb-6"
                />

                <button
                  onClick={() => {
                    handleAddToOrder(selectedItem)
                    setSelectedItem(null)
                  }}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Add {selectedItem.name} to Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING CART BUTTON */}
        {cartItemCount > 0 && (
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-4 rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center gap-3 z-40"
            aria-label={`View cart with ${cartItemCount} items`}
          >
            <span className="text-2xl">🛒</span>
            <div className="text-left">
              <span className="font-bold">{cartItemCount} item{cartItemCount > 1 ? 's' : ''}</span>
              <span className="block text-sm opacity-90">{formatPrice(cartSubtotal)}</span>
            </div>
          </button>
        )}

        {/* CART DRAWER */}
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
          dineInContext={dineInContext}
        />

        {/* FOOTER */}
        <footer className="text-center text-gray-500 text-sm pt-8 border-t">
          <div className="flex justify-center gap-4 mb-4">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Powered by AI</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Built on RABTUL</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">ReZ Intelligence</span>
          </div>
          <p>
            Powered by <a href="https://rez.money" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">ReZ Platform</a>
          </p>
        </footer>
      </div>
    </ErrorBoundary>
  )
}

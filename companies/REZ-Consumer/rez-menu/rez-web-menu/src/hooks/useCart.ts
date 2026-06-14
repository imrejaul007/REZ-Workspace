'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import type { MenuItem, CartItem } from '@/lib/services/types'
import { logger } from '@/lib/logger'

const CART_STORAGE_KEY = 'rez_menu_cart'
const CART_EXPIRY_HOURS = 24

interface StoredCart {
  items: CartItem[]
  storeSlug: string
  timestamp: number
}

interface UseCartReturn {
  items: CartItem[]
  isOpen: boolean
  itemCount: number
  subtotal: number
  storeSlug: string | null
  isLoading: boolean
  addItem: (item: MenuItem, quantity?: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  setIsOpen: (open: boolean) => void
  restoreCart: (items: CartItem[]) => void
}

function loadCartFromStorage(): StoredCart | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (!stored) return null

    const cart: StoredCart = JSON.parse(stored)
    const hoursSinceUpdate = (Date.now() - cart.timestamp) / (1000 * 60 * 60)

    if (hoursSinceUpdate > CART_EXPIRY_HOURS) {
      localStorage.removeItem(CART_STORAGE_KEY)
      return null
    }

    return cart
  } catch {
    return null
  }
}

function saveCartToStorage(cart: StoredCart): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  } catch (error) {
    logger.error('Failed to save cart to storage', error as Error)
  }
}

export function useCart(storeSlug?: string): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([])
  const [currentStoreSlug, setCurrentStoreSlug] = useState<string | null>(storeSlug || null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load cart from storage on mount
  useEffect(() => {
    const stored = loadCartFromStorage()
    if (stored) {
      // Check if cart is for the same store
      if (storeSlug && stored.storeSlug !== storeSlug) {
        // Different store, don't restore
        setItems([])
        setCurrentStoreSlug(storeSlug)
      } else {
        setItems(stored.items)
        setCurrentStoreSlug(stored.storeSlug)
      }
    } else if (storeSlug) {
      setCurrentStoreSlug(storeSlug)
    }
    setIsLoading(false)
  }, [storeSlug])

  // Persist cart to storage
  useEffect(() => {
    if (!isLoading && items.length > 0 && currentStoreSlug) {
      saveCartToStorage({
        items,
        storeSlug: currentStoreSlug,
        timestamp: Date.now(),
      })
    }
  }, [items, currentStoreSlug, isLoading])

  const addItem = useCallback((item: MenuItem, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === item.id)

      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        }
        return updated
      }

      const newItem: CartItem = {
        id: `cart_${item.id}_${Date.now()}`,
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity,
        image: item.images?.[0],
        customizations: {},
        addOns: [],
      }

      return [...prev, newItem]
    })

    logger.info('Added item to cart', { itemId: item.id, name: item.name })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId && i.productId !== itemId))
    logger.info('Removed item from cart', { itemId })
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId || item.productId === itemId) {
          return { ...item, quantity }
        }
        return item
      })
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CART_STORAGE_KEY)
    }
    logger.info('Cart cleared')
  }, [])

  const restoreCart = useCallback((cartItems: CartItem[]) => {
    setItems(cartItems)
    logger.info('Cart restored', { itemCount: cartItems.length })
    setIsOpen(true)
  }, [])

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )

  return {
    items,
    isOpen,
    itemCount,
    subtotal,
    storeSlug: currentStoreSlug,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setIsOpen,
    restoreCart,
  }
}

export default useCart

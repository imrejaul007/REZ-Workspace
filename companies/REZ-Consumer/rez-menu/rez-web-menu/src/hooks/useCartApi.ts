'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CartItem } from '@/lib/services/types'
import { getUserId } from './useAuth'
import { logger } from '@/lib/logger'

interface CartState {
  items: CartItem[]
  storeSlug: string
  subtotal: number
  itemCount: number
}

interface UseCartApiReturn {
  items: CartItem[]
  itemCount: number
  subtotal: number
  isLoading: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  addItem: (item: CartItem) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

export function useCartApi(storeSlug: string = 'demo-restaurant'): UseCartApiReturn {
  const [cart, setCart] = useState<CartState>({
    items: [],
    storeSlug,
    subtotal: 0,
    itemCount: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const userId = getUserId()

  const refreshCart = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/cart?storeSlug=${storeSlug}`, {
        headers: {
          'x-user-id': userId
        }
      })

      const data = await response.json()

      if (data.success && data.data) {
        setCart(data.data)
      }
    } catch (error) {
      logger.error('Failed to refresh cart', error as Error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, storeSlug])

  // Load cart on mount
  useEffect(() => {
    if (userId) {
      refreshCart()
    }
  }, [userId, refreshCart])

  const addItem = useCallback(async (item: CartItem) => {
    if (!userId) {
      logger.warn('Cannot add item - not authenticated')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ storeSlug, item })
      })

      const data = await response.json()

      if (data.success && data.data) {
        setCart(data.data)
        setIsOpen(true)
        logger.info('Item added to cart', { itemId: item.productId })
      }
    } catch (error) {
      logger.error('Failed to add item to cart', error as Error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, storeSlug])

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/cart', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ storeSlug, productId, quantity })
      })

      const data = await response.json()

      if (data.success && data.data) {
        setCart(data.data)
      }
    } catch (error) {
      logger.error('Failed to update cart', error as Error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, storeSlug])

  const removeItem = useCallback(async (productId: string) => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/cart?storeSlug=${storeSlug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ storeSlug, productId, quantity: 0 })
      })

      const data = await response.json()

      if (data.success && data.data) {
        setCart(data.data)
      }
    } catch (error) {
      logger.error('Failed to remove item', error as Error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, storeSlug])

  const clearCart = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/cart?storeSlug=${storeSlug}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId
        }
      })

      const data = await response.json()

      if (data.success) {
        setCart({
          items: [],
          storeSlug,
          subtotal: 0,
          itemCount: 0
        })
      }
    } catch (error) {
      logger.error('Failed to clear cart', error as Error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, storeSlug])

  return {
    items: cart.items,
    itemCount: cart.itemCount,
    subtotal: cart.subtotal,
    isLoading,
    isOpen,
    setIsOpen,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart
  }
}

export default useCartApi

'use client'

import { useState, useEffect } from 'react'
import type { CartItem } from '@/lib/services/types'
import { RecoveryService, AbandonmentService } from '@/lib/services'
import { logger } from '@/lib/logger'
import { formatPrice } from '@/lib/format'
import { CART_RECOVERY_CHECK_KEY } from '@/lib/constants'

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface AbandonedCartData {
  userId: string
  abandonedItems: Array<{
    itemId: string
    name: string
    price: number
    image?: string
    quantity: number
    abandonedAt: string
  }>
  nudgeEligible: boolean
  lastNudgeSent?: string
  nudgeCount: number
}

interface RecoveryStats {
  totalAbandoned: number
  recovered: number
  recoveryRate: number
  avgRecoveryTime: number
}

interface CartRecoveryProps {
  userId?: string
  storeSlug: string
  onRestoreCart?: (items: CartItem[]) => void
  className?: string
}

// ============================================================
// TYPE GUARD
// ============================================================

function isAbandonedCartData(data: unknown): data is AbandonedCartData {
  if (typeof data !== 'object' || data === null) return false

  const obj = data as Record<string, unknown>

  if (typeof obj.userId !== 'string') return false
  if (!Array.isArray(obj.abandonedItems)) return false

  return obj.abandonedItems.every((item): item is AbandonedCartData['abandonedItems'][0] => {
    if (typeof item !== 'object' || item === null) return false
    const i = item as Record<string, unknown>
    return (
      typeof i.itemId === 'string' &&
      typeof i.name === 'string' &&
      typeof i.price === 'number' &&
      typeof i.quantity === 'number'
    )
  })
}

function isRecoveryStats(data: unknown): data is RecoveryStats {
  if (typeof data !== 'object' || data === null) return false

  const obj = data as Record<string, unknown>

  return (
    typeof obj.totalAbandoned === 'number' &&
    typeof obj.recovered === 'number' &&
    typeof obj.recoveryRate === 'number' &&
    typeof obj.avgRecoveryTime === 'number'
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CartRecovery({
  userId,
  storeSlug,
  onRestoreCart,
  className = '',
}: CartRecoveryProps) {
  const [recovery, setRecovery] = useState<AbandonedCartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingNudge, setSendingNudge] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchAbandonedCart() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const result = await RecoveryService.getAbandonedCart(userId)

        if (!cancelled && result.success && result.data) {
          if (isAbandonedCartData(result.data)) {
            const data = result.data as AbandonedCartData
            if (data.abandonedItems.length > 0) {
              setRecovery(data)
              setShowRecovery(true)
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          logger.error('Failed to fetch abandoned cart', err as Error, { userId })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    // Check on mount (simulate abandoned cart detection)
    const hasShownRecovery = typeof window !== 'undefined'
      ? sessionStorage.getItem(CART_RECOVERY_CHECK_KEY)
      : null

    if (!hasShownRecovery) {
      fetchAbandonedCart()
    } else {
      setLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [userId, storeSlug])

  const handleSendNudge = async (channel: 'push' | 'whatsapp' | 'sms') => {
    if (!userId) return

    setSendingNudge(true)
    try {
      await RecoveryService.sendRecoveryNudge(userId, channel, {
        discount: 10,
        freeDelivery: true,
      })
      sessionStorage.setItem(CART_RECOVERY_CHECK_KEY, 'true')
      setShowRecovery(false)
      logger.info('Recovery nudge sent', { userId, channel })
    } catch (err) {
      logger.error('Failed to send recovery nudge', err as Error, { userId, channel })
    } finally {
      setSendingNudge(false)
    }
  }

  const handleRestore = () => {
    if (recovery && onRestoreCart) {
      const cartItems: CartItem[] = recovery.abandonedItems.map((item) => ({
        id: item.itemId,
        productId: item.itemId,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
      }))
      onRestoreCart(cartItems)
      sessionStorage.setItem(CART_RECOVERY_CHECK_KEY, 'true')
      setShowRecovery(false)
      logger.info('Cart restored', { itemCount: cartItems.length })
    }
  }

  const handleDismiss = () => {
    setShowRecovery(false)
    sessionStorage.setItem(CART_RECOVERY_CHECK_KEY, 'true')
  }

  if (loading || !showRecovery || !recovery) {
    return null
  }

  const totalValue = recovery.abandonedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
    <div
      className={`bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 ${className}`}
      role="region"
      aria-label="Cart recovery"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-xl" aria-hidden="true">
            🛒
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">You left something behind!</h3>
            <p className="text-sm text-gray-600">
              Your cart is waiting for you
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Dismiss cart recovery"
        >
          ✕
        </button>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {recovery.abandonedItems.slice(0, 3).map((item) => (
          <div key={item.itemId} className="flex items-center gap-3 bg-white rounded-lg p-2">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"
                aria-hidden="true"
              >
                🍽️
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
        {recovery.abandonedItems.length > 3 && (
          <p className="text-xs text-gray-500 text-center">
            +{recovery.abandonedItems.length - 3} more items
          </p>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between py-3 border-t border-amber-200 mb-4">
        <span className="text-gray-600">Cart Total</span>
        <span className="text-lg font-bold text-gray-900">{formatPrice(totalValue)}</span>
      </div>

      {/* Offer Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-3 mb-4 text-center">
        <p className="font-semibold">🎉 Complete your order and get</p>
        <p className="text-lg font-bold">10% OFF + Free Delivery!</p>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleRestore}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Restore Cart & Order
        </button>

        <div className="flex gap-2">
          {(['push', 'whatsapp', 'sms'] as const).map((channel) => (
            <button
              key={channel}
              onClick={() => handleSendNudge(channel)}
              disabled={sendingNudge}
              className="flex-1 text-sm py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              aria-label={`Send reminder via ${channel}`}
            >
              {channel === 'push' && '📱'}
              {channel === 'whatsapp' && '💬'}
              {channel === 'sms' && '📩'}
              <span className="sr-only">{channel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {recovery.nudgeCount > 0 && (
        <p className="text-xs text-gray-500 text-center mt-3">
          {recovery.nudgeCount} reminder{recovery.nudgeCount > 1 ? 's' : ''} sent
        </p>
      )}
    </div>
  )
}

// ============================================================
// RECOVERY ANALYTICS COMPONENT
// ============================================================

interface RecoveryStatsProps {
  storeSlug: string
  className?: string
}

export function RecoveryStats({ storeSlug, className = '' }: RecoveryStatsProps) {
  const [stats, setStats] = useState<RecoveryStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchStats() {
      try {
        const result = await AbandonmentService.getStats(storeSlug)
        if (!cancelled && result.success && result.data && isRecoveryStats(result.data)) {
          setStats(result.data)
        }
      } catch (err) {
        logger.warn('Recovery stats unavailable', { error: (err as Error).message })
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchStats()

    return () => {
      cancelled = true
    }
  }, [storeSlug])

  if (loading || !stats) {
    return null
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <p className="text-2xl font-bold text-gray-900">{stats.totalAbandoned}</p>
        <p className="text-sm text-gray-500">Carts Abandoned</p>
      </div>
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <p className="text-2xl font-bold text-green-600">{stats.recovered}</p>
        <p className="text-sm text-gray-500">Recovered</p>
      </div>
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <p className="text-2xl font-bold text-blue-600">{stats.recoveryRate.toFixed(1)}%</p>
        <p className="text-sm text-gray-500">Recovery Rate</p>
      </div>
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <p className="text-2xl font-bold text-amber-600">{stats.avgRecoveryTime.toFixed(0)}m</p>
        <p className="text-sm text-gray-500">Avg Recovery Time</p>
      </div>
    </div>
  )
}

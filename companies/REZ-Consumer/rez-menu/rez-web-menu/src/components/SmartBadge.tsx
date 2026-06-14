'use client'

import { useState, useEffect } from 'react'
import type { TrendingItem, ScarcityStatus } from '@/lib/services'
import { DemandService, ScarcityService } from '@/lib/services'
import { logger } from '@/lib/logger'
import { API_TIMEOUT_MS } from '@/lib/constants'

interface SmartBadgeProps {
  itemId: string
  itemName: string
  storeSlug: string
  className?: string
  showScarcity?: boolean
  showTrending?: boolean
}

interface BadgeData {
  type: 'trending' | 'popular' | 'scarce' | 'new' | 'chef-special'
  label: string
  icon: string
  color: string
  data?: Record<string, unknown>
}

export default function SmartBadge({
  itemId,
  itemName,
  storeSlug,
  className = '',
  showScarcity = true,
  showTrending = true,
}: SmartBadgeProps) {
  const [badges, setBadges] = useState<BadgeData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchBadges() {
      const badgeList: BadgeData[] = []

      // Fetch trending data
      if (showTrending) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

          const trendingResult = await DemandService.getTrending(storeSlug, 20)

          clearTimeout(timeoutId)

          if (cancelled) return

          if (trendingResult.success && trendingResult.data) {
            const trendingItem = trendingResult.data.items.find(
              (t: TrendingItem) => t.itemId === itemId
            )
            if (trendingItem && trendingItem.rank <= 10) {
              badgeList.push({
                type: 'trending',
                label: `Trending #${trendingItem.rank}`,
                icon: '🔥',
                color: 'bg-orange-100 text-orange-700',
                data: { orders: trendingItem.ordersToday, velocity: trendingItem.velocity },
              })
            } else if (trendingItem) {
              badgeList.push({
                type: 'popular',
                label: `${trendingItem.ordersToday} ordered today`,
                icon: '⭐',
                color: 'bg-yellow-100 text-yellow-700',
                data: { orders: trendingItem.ordersToday },
              })
            }
          }
        } catch (err) {
          logger.warn('Trending service unavailable', { error: (err as Error).message })
        }
      }

      // Fetch scarcity data
      if (showScarcity && !cancelled) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

          const scarcityResult = await ScarcityService.getStockStatus(storeSlug)

          clearTimeout(timeoutId)

          if (cancelled) return

          if (scarcityResult.success && scarcityResult.data) {
            const scarcityItem = scarcityResult.data.items.find(
              (s: ScarcityStatus) => s.itemId === itemId
            )
            if (scarcityItem) {
              if (scarcityItem.status === 'scarce') {
                badgeList.push({
                  type: 'scarce',
                  label: `Only ${scarcityItem.quantity} left!`,
                  icon: '⏰',
                  color: 'bg-red-100 text-red-700',
                  data: { quantity: scarcityItem.quantity },
                })
              } else if (scarcityItem.status === 'low') {
                badgeList.push({
                  type: 'scarce',
                  label: 'Selling fast',
                  icon: '⚡',
                  color: 'bg-amber-100 text-amber-700',
                  data: { quantity: scarcityItem.quantity },
                })
              }
            }
          }
        } catch (err) {
          logger.warn('Scarcity service unavailable', { error: (err as Error).message })
        }
      }

      // Check for chef's special (from tags)
      if (!cancelled && (itemName.toLowerCase().includes("chef's") || itemName.toLowerCase().includes('special'))) {
        badgeList.push({
          type: 'chef-special',
          label: "Chef's Special",
          icon: '👨‍🍳',
          color: 'bg-purple-100 text-purple-700',
        })
      }

      // Check for new items (items with "new" in name or recent addition)
      if (!cancelled && itemName.toLowerCase().startsWith('new ')) {
        badgeList.push({
          type: 'new',
          label: 'New',
          icon: '🆕',
          color: 'bg-green-100 text-green-700',
        })
      }

      if (!cancelled) {
        setBadges(badgeList)
        setLoading(false)
      }
    }

    fetchBadges()

    return () => {
      cancelled = true
    }
  }, [itemId, itemName, storeSlug, showScarcity, showTrending])

  if (loading || badges.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="list" aria-label="Item badges">
      {badges.map((badge, index) => (
        <span
          key={`${badge.type}-${index}`}
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${badge.color}`}
          title={badge.data ? `${badge.icon} ${badge.label}` : badge.label}
          role="listitem"
        >
          <span aria-hidden="true">{badge.icon}</span>
          <span>{badge.label}</span>
        </span>
      ))}
    </div>
  )
}

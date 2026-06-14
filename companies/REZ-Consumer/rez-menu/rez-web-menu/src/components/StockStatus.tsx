'use client'

import { useState, useEffect } from 'react'
import type { ScarcityStatus } from '@/lib/services'
import { ScarcityService } from '@/lib/services'

interface StockStatusProps {
  itemId: string
  storeSlug: string
  showVelocity?: boolean
  className?: string
}

export default function StockStatus({
  itemId,
  storeSlug,
  showVelocity = true,
  className = '',
}: StockStatusProps) {
  const [status, setStatus] = useState<ScarcityStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const result = await ScarcityService.getItemStatus(itemId)
        if (result.success && result.data) {
          setStatus(result.data)
        }
      } catch (error) {
        console.log('Scarcity service unavailable')
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [itemId])

  if (loading || !status) {
    return null
  }

  const getStatusConfig = () => {
    switch (status.status) {
      case 'soldout':
        return {
          label: 'Sold Out',
          icon: '❌',
          color: 'bg-red-100 text-red-700 border-red-200',
          showProgress: false,
        }
      case 'scarce':
        return {
          label: `Only ${status.quantity} left!`,
          icon: '🔥',
          color: 'bg-orange-100 text-orange-700 border-orange-200',
          showProgress: true,
          progress: 20,
        }
      case 'low':
        return {
          label: 'Limited stock',
          icon: '⚡',
          color: 'bg-amber-100 text-amber-700 border-amber-200',
          showProgress: true,
          progress: 40,
        }
      case 'available':
      default:
        if (status.velocity > 5) {
          return {
            label: `${status.velocity} ordered in last hour`,
            icon: '⚡',
            color: 'bg-green-100 text-green-700 border-green-200',
            showProgress: false,
          }
        }
        return {
          label: 'In Stock',
          icon: '✅',
          color: 'bg-green-100 text-green-700 border-green-200',
          showProgress: false,
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${config.color}`}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </div>

      {config.showProgress && (
        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              config.progress === 20 ? 'bg-red-500' : 'bg-amber-500'
            }`}
            style={{ width: `${config.progress}%` }}
          />
        </div>
      )}

      {showVelocity && status.velocity > 0 && status.status === 'available' && (
        <span className="text-xs text-gray-500">
          ({status.velocity}/hr)
        </span>
      )}
    </div>
  )
}

// ============================================================
// STOCK GRID COMPONENT
// ============================================================

interface StockGridProps {
  storeSlug: string
  onItemStatusChange?: (itemId: string, status: ScarcityStatus) => void
  className?: string
}

export function StockGrid({ storeSlug, onItemStatusChange, className = '' }: StockGridProps) {
  const [items, setItems] = useState<ScarcityStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStock() {
      try {
        const result = await ScarcityService.getStockStatus(storeSlug)
        if (result.success && result.data) {
          setItems(result.data.items)
          result.data.items.forEach((item) => {
            onItemStatusChange?.(item.itemId, item)
          })
        }
      } catch (error) {
        console.log('Scarcity service unavailable')
      } finally {
        setLoading(false)
      }
    }

    fetchStock()
  }, [storeSlug, onItemStatusChange])

  if (loading) {
    return (
      <div className={`grid grid-cols-4 gap-2 ${className}`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'soldout':
        return 'bg-red-500'
      case 'scarce':
        return 'bg-orange-500'
      case 'low':
        return 'bg-amber-500'
      default:
        return 'bg-green-500'
    }
  }

  return (
    <div className={`grid grid-cols-4 gap-2 ${className}`}>
      {items.slice(0, 8).map((item) => (
        <div
          key={item.itemId}
          className="relative h-20 bg-white rounded-lg border border-gray-200 p-2"
        >
          <div className="absolute top-2 left-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-xs font-medium text-gray-900 truncate">
              {item.itemId.slice(0, 8)}...
            </p>
            <p className="text-xs text-gray-500">
              {item.quantity} left
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

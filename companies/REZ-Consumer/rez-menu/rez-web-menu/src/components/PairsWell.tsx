'use client'

import { useState, useEffect } from 'react'
import type { MenuItem, PairingItem } from '@/lib/services'
import { SimilarityService } from '@/lib/services'

interface PairsWellProps {
  itemId: string
  itemName: string
  storeSlug: string
  onAddToCart?: (item: MenuItem) => void
  className?: string
}

export default function PairsWell({
  itemId,
  itemName,
  storeSlug,
  onAddToCart,
  className = '',
}: PairsWellProps) {
  const [pairs, setPairs] = useState<PairingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    async function fetchPairs() {
      try {
        const result = await SimilarityService.getPairs(itemId, storeSlug, 4)
        if (result.success && result.data) {
          setPairs(result.data.items)
        }
      } catch (error) {
        console.log('Similarity service unavailable')
      } finally {
        setLoading(false)
      }
    }

    fetchPairs()
  }, [itemId, storeSlug])

  if (loading || pairs.length === 0) {
    return null
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'frequently_bought':
        return '🛒'
      case 'goes_well':
        return '🍽️'
      case 'alternative':
        return '🔄'
      default:
        return '✨'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'frequently_bought':
        return 'Frequently bought together'
      case 'goes_well':
        return 'Pairs perfectly with'
      case 'alternative':
        return 'You might also like'
      default:
        return 'Recommended'
    }
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🍽️</span>
          <span className="font-semibold text-gray-900">{getTypeLabel(pairs[0]?.type)}</span>
        </div>
        <span className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {pairs.map((pair) => (
            <div
              key={pair.itemId}
              className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                {pair.image ? (
                  <img
                    src={pair.image}
                    alt={pair.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                    {getTypeIcon(pair.type)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{pair.name}</p>
                  <p className="text-sm text-gray-500">
                    {getTypeIcon(pair.type)} {Math.round(pair.confidence * 100)}% match
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-green-600">₹{pair.price.toFixed(0)}</span>
                {onAddToCart && (
                  <button
                    onClick={() =>
                      onAddToCart({
                        id: pair.itemId,
                        name: pair.name,
                        price: pair.price,
                        images: pair.image ? [pair.image] : undefined,
                        category: '',
                        description: '',
                        available: true,
                      })
                    }
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-500 text-center">
            Based on what customers like you usually order together
          </p>
        </div>
      )}
    </div>
  )
}

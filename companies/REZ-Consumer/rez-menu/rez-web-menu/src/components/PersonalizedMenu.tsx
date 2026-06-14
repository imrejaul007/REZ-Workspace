'use client'

import { useState, useEffect } from 'react'
import type { MenuItem, PersonalizedRecommendation } from '@/lib/services/types'
import { PersonalizationService } from '@/lib/services'
import { logger } from '@/lib/logger'
import { formatPrice } from '@/lib/format'

interface PersonalizedMenuProps {
  userId?: string
  storeSlug: string
  items: MenuItem[]
  onReorder?: (rankedItems: MenuItem[]) => void
  className?: string
}

interface RankedItem extends MenuItem {
  recommendation?: PersonalizedRecommendation
}

export default function PersonalizedMenu({
  userId,
  storeSlug,
  items,
  onReorder,
  className = '',
}: PersonalizedMenuProps) {
  const [rankedItems, setRankedItems] = useState<RankedItem[]>(items)
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [showPersonalized, setShowPersonalized] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function personalizeMenu() {
      if (!userId || items.length === 0) {
        setLoading(false)
        return
      }

      try {
        const result = await PersonalizationService.getRecommendations(
          userId,
          storeSlug,
          'browse',
          5
        )

        if (cancelled) return

        if (result.success && result.data) {
          setRecommendations(result.data.items)

          // Create lookup map
          const itemScores = new Map(
            result.data.items.map((r) => [r.itemId, r])
          )

          // Reorder items based on AI scores
          const ranked: RankedItem[] = [
            ...items
              .filter((item) => itemScores.has(item.id))
              .map((item) => ({
                ...item,
                recommendation: itemScores.get(item.id),
              }))
              .sort((a, b) => {
                const scoreA = a.recommendation?.score || 0
                const scoreB = b.recommendation?.score || 0
                return scoreB - scoreA
              }),
            ...items
              .filter((item) => !itemScores.has(item.id))
              .map((item) => ({ ...item })),
          ]

          if (!cancelled) {
            setRankedItems(ranked)
            onReorder?.(ranked)
          }
        }
      } catch (err) {
        logger.warn('Personalization service unavailable', { error: (err as Error).message })
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    personalizeMenu()

    return () => {
      cancelled = true
    }
  }, [userId, storeSlug, items, onReorder])

  const getReasonBadge = (reason: string, reasonText?: string) => {
    switch (reason) {
      case 'taste':
        return {
          icon: '👅',
          label: 'Your taste',
          color: 'bg-purple-100 text-purple-700',
        }
      case 'history':
        return {
          icon: '📜',
          label: 'Ordered before',
          color: 'bg-blue-100 text-blue-700',
        }
      case 'similar':
        return {
          icon: '✨',
          label: 'You might like',
          color: 'bg-indigo-100 text-indigo-700',
        }
      case 'trending':
        return {
          icon: '🔥',
          label: 'Trending now',
          color: 'bg-orange-100 text-orange-700',
        }
      case 'seasonal':
        return {
          icon: '🌟',
          label: 'Perfect for now',
          color: 'bg-green-100 text-green-700',
        }
      default:
        return {
          icon: '🎯',
          label: 'Recommended',
          color: 'bg-gray-100 text-gray-700',
        }
    }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-48" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  // Get personalized items at top
  const personalizedItems = rankedItems.filter((item) => item.recommendation)
  const regularItems = rankedItems.filter((item) => !item.recommendation)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toggle for personalization */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {showPersonalized ? 'For You' : 'All Items'}
        </h3>
        {userId && recommendations.length > 0 && (
          <button
            onClick={() => setShowPersonalized(!showPersonalized)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span aria-hidden="true">{showPersonalized ? '📋' : '🎯'}</span>
            <span>{showPersonalized ? 'Show all' : 'Show recommended'}</span>
          </button>
        )}
      </div>

      {/* Personalized section */}
      {showPersonalized && personalizedItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span aria-hidden="true">🎯</span>
            <span>Curated based on your preferences</span>
          </div>

          {personalizedItems.map((item) => {
            const badge = item.recommendation
              ? getReasonBadge(item.recommendation.reason, item.recommendation.reasonText)
              : null

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-green-600 ml-4">
                      {formatPrice(item.price)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {badge && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${badge.color}`}
                        >
                          <span aria-hidden="true">{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                      )}
                      {item.recommendation && (
                        <span className="text-xs text-gray-400">
                          {Math.round(item.recommendation.score * 100)}% match
                        </span>
                      )}
                    </div>

                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      Add to Order
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Regular items */}
      {(!showPersonalized || regularItems.length > 0) && (
        <div className="space-y-4">
          {showPersonalized && personalizedItems.length > 0 && (
            <h4 className="text-sm font-medium text-gray-700 pt-4 border-t">
              More Items
            </h4>
          )}

          {regularItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {item.description}
                  </p>
                </div>
                <span className="text-lg font-bold text-green-600 ml-4">
                  {formatPrice(item.price)}
                </span>
              </div>
              <div className="mt-3 flex justify-end">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Add to Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!userId && (
        <div className="text-center py-6 text-gray-500 text-sm">
          <p>Sign in to get personalized recommendations</p>
        </div>
      )}
    </div>
  )
}

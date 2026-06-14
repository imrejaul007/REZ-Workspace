'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { MenuItem } from '@/lib/services/types'
import { logger } from '@/lib/logger'
import { formatPrice } from '@/lib/format'
import { BUNDLE_DISCOUNT_PERCENT, SIDES_MAX_SELECTIONS } from '@/lib/constants'

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface BundleOption {
  id: string
  name: string
  required: boolean
  multiSelect: boolean
  maxSelections?: number
  items: Array<{
    id: string
    name: string
    price: number
    available: boolean
  }>
}

interface SelectedItem {
  id: string
  name: string
  price: number
}

interface BundleBuilderProps {
  baseItems: MenuItem[]
  bundles?: BundleOption[]
  onBundleSelect?: (selectedItems: Map<string, SelectedItem[]>, total: number) => void
  className?: string
}

// ============================================================
// SINGLE-SELECT BUNDLES
// ============================================================

const SINGLE_SELECT_BUNDLES = ['mains', 'drinks', 'desserts'] as const

// ============================================================
// COMPONENT
// ============================================================

export default function BundleBuilder({
  baseItems,
  bundles,
  onBundleSelect,
  className = '',
}: BundleBuilderProps) {
  const [selections, setSelections] = useState<Map<string, SelectedItem[]>>(new Map())
  const [expanded, setExpanded] = useState(true)

  // Default bundles based on categories
  const defaultBundles: BundleOption[] = useMemo(() => {
    const bundleOptions: BundleOption[] = []

    // Main course bundle
    const mains = baseItems.filter(
      (item) =>
        item.category.toLowerCase().includes('main') ||
        item.category.toLowerCase().includes('curry')
    )
    if (mains.length > 0) {
      bundleOptions.push({
        id: 'mains',
        name: 'Choose Your Main Course',
        required: true,
        multiSelect: false,
        items: mains.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          available: item.available,
        })),
      })
    }

    // Sides bundle
    const sides = baseItems.filter((item) =>
      ['bread', 'rice', 'naan', 'roti', 'side'].some((s) =>
        item.category.toLowerCase().includes(s)
      )
    )
    if (sides.length > 0) {
      bundleOptions.push({
        id: 'sides',
        name: 'Add a Side',
        required: false,
        multiSelect: true,
        maxSelections: SIDES_MAX_SELECTIONS,
        items: sides.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          available: item.available,
        })),
      })
    }

    // Beverage bundle
    const drinks = baseItems.filter((item) =>
      ['drink', 'beverage', 'lassi', 'tea', 'coffee'].some((d) =>
        item.category.toLowerCase().includes(d)
      )
    )
    if (drinks.length > 0) {
      bundleOptions.push({
        id: 'drinks',
        name: 'Beverage',
        required: false,
        multiSelect: false,
        items: drinks.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          available: item.available,
        })),
      })
    }

    // Dessert bundle
    const desserts = baseItems.filter((item) =>
      ['dessert', 'sweet', 'ice cream'].some((d) =>
        item.category.toLowerCase().includes(d)
      )
    )
    if (desserts.length > 0) {
      bundleOptions.push({
        id: 'desserts',
        name: 'End with Something Sweet',
        required: false,
        multiSelect: false,
        items: desserts.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          available: item.available,
        })),
      })
    }

    return bundleOptions
  }, [baseItems])

  const activeBundles = bundles || defaultBundles

  const handleSelect = useCallback(
    (bundleId: string, itemId: string, item: SelectedItem) => {
      setSelections((prev) => {
        const newSelections = new Map(prev)
        const isSingleSelect = SINGLE_SELECT_BUNDLES.includes(bundleId as typeof SINGLE_SELECT_BUNDLES[number])

        if (isSingleSelect) {
          // Single select
          newSelections.set(bundleId, [item])
        } else {
          // Multi select
          const current = newSelections.get(bundleId) || []
          const existingIndex = current.findIndex((i) => i.id === itemId)

          if (existingIndex >= 0) {
            // Deselect
            newSelections.set(
              bundleId,
              current.filter((i) => i.id !== itemId)
            )
          } else {
            // Check max selections
            const bundle = activeBundles.find((b) => b.id === bundleId)
            if (bundle?.maxSelections && current.length >= bundle.maxSelections) {
              // Replace oldest selection
              newSelections.set(bundleId, [...current.slice(1), item])
            } else {
              // Add selection
              newSelections.set(bundleId, [...current, item])
            }
          }
        }

        // Calculate total
        let total = 0
        newSelections.forEach((items) => {
          items.forEach((i) => {
            total += i.price
          })
        })

        onBundleSelect?.(newSelections, total)
        return newSelections
      })
    },
    [activeBundles, onBundleSelect]
  )

  const total = useMemo(() => {
    let sum = 0
    selections.forEach((items) => {
      items.forEach((i) => {
        sum += i.price
      })
    })
    return sum
  }, [selections])

  const isRequiredComplete = useMemo(() => {
    return activeBundles
      .filter((b) => b.required)
      .every((bundle) => {
        const selected = selections.get(bundle.id)
        return selected && selected.length > 0
      })
  }, [activeBundles, selections])

  const savings = useMemo(() => {
    // Calculate savings (bundles are typically 15% off)
    const itemTotal = activeBundles
      .filter((b) => b.required)
      .reduce((sum, bundle) => {
        const selected = selections.get(bundle.id)
        return sum + (selected?.reduce((s, i) => s + i.price, 0) || 0)
      }, 0)
    return itemTotal * (BUNDLE_DISCOUNT_PERCENT / 100)
  }, [activeBundles, selections])

  const handleAddToOrder = useCallback(() => {
    logger.info('Bundle added to order', {
      selections: Object.fromEntries(selections),
      total,
      savings,
    })
    // Would call cart API here
  }, [selections, total, savings])

  if (activeBundles.length === 0) {
    return null
  }

  return (
    <div className={`bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
        aria-expanded={expanded}
        aria-controls="bundle-content"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🎁</span>
          <span className="font-semibold text-gray-900">Build Your Combo</span>
        </div>
        <div className="flex items-center gap-3">
          {isRequiredComplete && (
            <span className="text-sm text-green-600 font-medium">
              {savings > 0 && `Save ${formatPrice(savings)}!`}
            </span>
          )}
          <span
            className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            ▼
          </span>
        </div>
      </button>

      {expanded && (
        <div id="bundle-content" className="space-y-4" role="group" aria-label="Bundle options">
          {activeBundles.map((bundle) => (
            <div key={bundle.id} className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{bundle.name}</h4>
                {bundle.required && (
                  <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">
                    Required
                  </span>
                )}
                {bundle.multiSelect && bundle.maxSelections && (
                  <span className="text-xs text-gray-500">
                    Select up to {bundle.maxSelections}
                  </span>
                )}
              </div>

              <div className="space-y-2" role="radiogroup" aria-label={bundle.name}>
                {bundle.items.map((item) => {
                  const isSelected = selections.get(bundle.id)?.some((i) => i.id === item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(bundle.id, item.id, item)}
                      disabled={!item.available}
                      className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : item.available
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}
                      aria-checked={isSelected}
                      role={bundle.multiSelect ? 'checkbox' : 'radio'}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}
                          aria-hidden="true"
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-gray-900">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.price > 0 ? `+${formatPrice(item.price)}` : 'Included'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center justify-between py-3 border-t border-indigo-200">
            <span className="font-semibold text-gray-900">Combo Total</span>
            <div className="text-right">
              <span className="text-xl font-bold text-indigo-600">{formatPrice(total)}</span>
              {savings > 0 && (
                <span className="ml-2 text-sm text-green-600">
                  (Save {formatPrice(savings)})
                </span>
              )}
            </div>
          </div>

          {/* Add to Order Button */}
          <button
            onClick={handleAddToOrder}
            disabled={!isRequiredComplete}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              isRequiredComplete
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isRequiredComplete ? 'Add Combo to Order' : 'Complete your selections'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            💡 Bundles are {BUNDLE_DISCOUNT_PERCENT}% cheaper than ordering items separately
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// PRE-BUILT BUNDLES COMPONENT
// ============================================================

interface PreBuiltBundle {
  id: string
  name: string
  description: string
  items: MenuItem[]
  originalPrice: number
  bundlePrice: number
  image?: string
}

interface PreBuiltBundlesProps {
  bundles: PreBuiltBundle[]
  onSelectBundle?: (bundle: PreBuiltBundle) => void
  className?: string
}

export function PreBuiltBundles({
  bundles,
  onSelectBundle,
  className = '',
}: PreBuiltBundlesProps) {
  if (bundles.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">🎁</span>
        <h3 className="text-lg font-semibold text-gray-900">Popular Combos</h3>
      </div>

      <div className="grid gap-4">
        {bundles.map((bundle) => {
          const savings = bundle.originalPrice - bundle.bundlePrice
          const savingsPercent = ((savings / bundle.originalPrice) * 100).toFixed(0)

          return (
            <div
              key={bundle.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{bundle.name}</h4>
                    <p className="text-sm text-gray-500">{bundle.description}</p>
                  </div>
                  {savings > 0 && (
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
                      Save {savingsPercent}%
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {bundle.items.slice(0, 4).map((item) => (
                    <span
                      key={item.id}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                    >
                      {item.name}
                    </span>
                  ))}
                  {bundle.items.length > 4 && (
                    <span className="text-xs text-gray-400 px-2 py-0.5">
                      +{bundle.items.length - 4} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-900">
                      {formatPrice(bundle.bundlePrice)}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(bundle.originalPrice)}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectBundle?.(bundle)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Add Combo
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

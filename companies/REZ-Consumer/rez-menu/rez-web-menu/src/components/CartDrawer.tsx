'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { CartItem } from '@/lib/services/types'
import { formatPrice } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'

interface CartDrawerProps {
  items: CartItem[]
  itemCount: number
  subtotal: number
  isOpen: boolean
  onClose: () => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  storeSlug: string
  isLoading?: boolean
}

export default function CartDrawer({
  items,
  itemCount,
  subtotal,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  storeSlug,
  isLoading = false
}: CartDrawerProps) {
  const { isAuthenticated } = useAuth()

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const tax = Math.round(subtotal * 0.05)
  const total = subtotal + tax
  const savings = 0 // Could be calculated if discounts applied

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in"
        role="dialog"
        aria-modal="true"
        aria-label="Your order"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/25">
              🛒
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Order</h2>
              {itemCount > 0 && (
                <p className="text-sm text-gray-500">{itemCount} item{itemCount > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-5xl mb-6">
                🍽️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-500 mb-8 max-w-xs">
                Add some delicious items from our menu to get started!
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {/* Store Info */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">
                    🏪
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{storeSlug}</p>
                    <p className="text-sm text-gray-500">Estimated prep: 15-20 min</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow"
                  >
                    {item.image ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                        🍽️
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                        <span className="font-bold text-green-600 flex-shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                        {'description' in item ? (item as { description?: string }).description : ''}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-700 font-medium transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center text-white font-medium transition-colors"
                            aria-label="Increase quantity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.productId)}
                          className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          aria-label="Remove item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-9V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear Cart */}
              <button
                onClick={onClearCart}
                className="w-full text-sm text-gray-400 hover:text-red-500 py-2 flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-9V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Cart
              </button>
            </div>
          )}
        </div>

        {/* Footer - Order Summary */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 bg-white p-6 space-y-4">
            {/* Savings Banner */}
            {savings > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                <span className="text-xl">🎉</span>
                <div>
                  <p className="text-sm font-semibold text-green-700">You save {formatPrice(savings)}!</p>
                  <p className="text-xs text-green-600">On this order</p>
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (5% GST)</span>
                <span className="font-medium">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery Fee</span>
                <span className="line-through">₹40</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="h-px bg-gray-100 my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-green-600">{formatPrice(total)}</span>
              </div>
            </div>

            {/* ReZ Coins Earned */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/25">
                R
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Earn {Math.floor(total / 10)} ReZ Coins</p>
                <p className="text-xs text-gray-500">Worth ₹{Math.floor(total / 100)} on next order</p>
              </div>
            </div>

            {/* Checkout Button */}
            {isAuthenticated ? (
              <Link
                href="/checkout"
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-4 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                onClick={onClose}
              >
                Checkout • {formatPrice(total)}
              </Link>
            ) : (
              <Link
                href="/login?redirect=/checkout"
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-4 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                onClick={onClose}
              >
                Login to Checkout
              </Link>
            )}

            {/* Secure Payment */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure payment powered by RABTUL
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

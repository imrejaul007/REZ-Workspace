'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Order } from '@/lib/services/types'
import { formatPrice } from '@/lib/format'
import { useAuth, getUserId } from '@/hooks/useAuth'
import { logger } from '@/lib/logger'

export default function OrderConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const orderId = params.id as string

  useEffect(() => {
    async function loadOrder() {
      const userId = getUserId()
      if (!userId) {
        router.push('/')
        return
      }

      try {
        const response = await fetch(`/api/orders?orderId=${orderId}`, {
          headers: { 'x-user-id': userId }
        })
        const data = await response.json()

        if (data.success) {
          setOrder(data.data)
        } else {
          router.push('/')
        }
      } catch (error) {
        logger.error('Failed to load order', error as Error)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrder()
  }, [orderId, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!order) {
    return null
  }

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: '📝' },
    { key: 'confirmed', label: 'Confirmed', icon: '✓' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
    { key: 'ready', label: 'Ready', icon: '✅' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵' },
    { key: 'delivered', label: 'Delivered', icon: '🎉' },
  ]

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-green-100">
            Order #{order.orderNumber} • {formatPrice(order.total)}
          </p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 -mt-6">
        {/* Order Status Timeline */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Status</h2>
          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex
              const isCurrent = index === currentStepIndex

              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}>
                    {isCompleted ? step.icon : (index + 1)}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {order.timeline.find(t => t.status === step.key) && (
                      <p className="text-xs text-gray-500">
                        {new Date(order.timeline.find(t => t.status === step.key)!.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {isCurrent && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Order Details */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {item.quantity}x {item.name}
                  </p>
                  {item.customizations && Object.keys(item.customizations).length > 0 && (
                    <p className="text-sm text-gray-500">
                      {Object.entries(item.customizations).map(([key, value]) =>
                        `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
                      ).join(', ')}
                    </p>
                  )}
                </div>
                <span className="font-medium">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            {order.deliveryFee && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total Paid</span>
              <span className="text-green-600">{formatPrice(order.total)}</span>
            </div>
          </div>
        </section>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delivery Address</h2>
            <p className="text-gray-600">
              {order.deliveryAddress.address}<br />
              {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
            </p>
          </section>
        )}

        {/* Cashback Earned */}
        <section className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🪙</span>
            <div>
              <h3 className="font-bold text-gray-900">You earned {(order.total * 0.1).toFixed(0)} REZ Coins!</h3>
              <p className="text-sm text-gray-600">10% cashback on this order</p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/orders"
            className="block w-full bg-white text-blue-600 text-center py-3 rounded-xl font-semibold border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            View All Orders
          </Link>
        </div>
      </main>
    </div>
  )
}

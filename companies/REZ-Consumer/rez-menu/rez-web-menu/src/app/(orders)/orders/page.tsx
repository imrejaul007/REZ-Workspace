'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Order } from '@/lib/services/types'
import { formatPrice } from '@/lib/format'
import { useAuth, getUserId } from '@/hooks/useAuth'
import { logger } from '@/lib/logger'

const ORDER_STATUS_LABELS: Record<Order['status'], { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Preparing', color: 'bg-orange-100 text-orange-700' },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-700' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-700' },
}

export default function OrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadOrders() {
      const userId = getUserId()
      if (!userId) return

      try {
        const response = await fetch('/api/orders', {
          headers: { 'x-user-id': userId }
        })
        const data = await response.json()

        if (data.success) {
          setOrders(data.data.orders)
        }
      } catch (error) {
        logger.error('Failed to load orders', error as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📦</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">
              Your order history will appear here
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = ORDER_STATUS_LABELS[order.status]

              return (
                <Link
                  key={order.id}
                  href={`/order/${order.id}`}
                  className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="text-sm text-gray-600">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-green-600">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>

                  {order.deliveryAddress && (
                    <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                      📍 {order.deliveryAddress.address}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

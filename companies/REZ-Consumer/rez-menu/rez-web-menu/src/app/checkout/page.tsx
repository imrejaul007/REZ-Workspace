'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { CartItem, OrderItem } from '@/lib/services/types'
import { formatPrice } from '@/lib/format'
import { useAuth, getAuthHeaders, getUserId } from '@/hooks/useAuth'
import { logger } from '@/lib/logger'

interface CheckoutItem extends CartItem {
  selected?: boolean
}

// Dine-in context type
interface DineInContext {
  tableNumber: string
  restaurantSlug: string
  isDineIn: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user } = useAuth()

  // Get store slug and table from URL params
  const storeSlug = searchParams?.get('store') || 'demo-restaurant'
  const tableParam = searchParams?.get('table')

  const [cart, setCart] = useState<{
    items: CartItem[]
    subtotal: number
    dineInContext?: DineInContext | null
  }>({ items: [], subtotal: 0, dineInContext: null })
  const [isLoading, setIsLoading] = useState(true)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  // Address state
  const [address, setAddress] = useState({
    address: '',
    city: 'Mumbai',
    pincode: '',
  })

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'wallet' | 'cod'>('upi')

  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0)
  const [useWallet, setUseWallet] = useState(false)

  // Determine if dine-in
  const isDineIn = tableParam || cart.dineInContext?.isDineIn
  const tableNumber = cart.dineInContext?.tableNumber || tableParam

  // Load cart and wallet
  useEffect(() => {
    async function loadData() {
      const userId = getUserId()
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        // Load cart
        const cartRes = await fetch(`/api/cart?storeSlug=${storeSlug}`, {
          headers: { 'x-user-id': userId }
        })
        const cartData = await cartRes.json()
        if (cartData.success) {
          setCart({
            items: cartData.data.items,
            subtotal: cartData.data.subtotal,
            dineInContext: cartData.data.dineInContext ? {
              tableNumber: cartData.data.dineInContext.tableNumber,
              restaurantSlug: storeSlug,
              isDineIn: true,
            } : null
          })
        }

        // Load wallet
        const walletRes = await fetch('/api/wallet', {
          headers: { 'x-user-id': userId }
        })
        const walletData = await walletRes.json()
        if (walletData.success) {
          setWalletBalance(walletData.data.wallet.coins)
        }
      } catch (error) {
        logger.error('Failed to load checkout data', error as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [storeSlug])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/?login=required')
    }
  }, [isLoading, isAuthenticated, router])

  const tax = Math.round(cart.subtotal * 0.05)
  // No delivery fee for dine-in orders
  const deliveryFee = isDineIn ? 0 : (address.address ? 40 : 0)
  const coinDiscount = useWallet ? Math.min(walletBalance, cart.subtotal * 0.1) : 0 // 10% max from wallet
  const total = cart.subtotal + tax + deliveryFee - coinDiscount

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) return
    if (!isDineIn && !address.address && deliveryFee > 0) {
      alert('Please enter delivery address')
      return
    }

    setIsPlacingOrder(true)
    const userId = getUserId()

    try {
      // Create order
      const orderItems: OrderItem[] = cart.items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }))

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || ''
        },
        body: JSON.stringify({
          storeSlug,
          items: orderItems,
          deliveryAddress: !isDineIn && address.address ? address : undefined,
          paymentMethod: useWallet ? 'wallet' : paymentMethod,
          // Dine-in specific
          ...(isDineIn && {
            tableNumber: tableNumber,
            orderType: 'dine_in',
          }),
        })
      })

      const orderData = await orderRes.json()

      if (orderData.success) {
        // Deduct coins if using wallet
        if (useWallet && coinDiscount > 0) {
          await fetch('/api/wallet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId || ''
            },
            body: JSON.stringify({
              action: 'redeem',
              amount: coinDiscount,
              description: 'Order payment',
              orderId: orderData.data.orderId
            })
          })
        }

        // Clear cart
        await fetch(`/api/cart?storeSlug=${storeSlug}`, {
          method: 'DELETE',
          headers: { 'x-user-id': userId || '' }
        })

        // Award coins (10% cashback)
        const coinsEarned = Math.round(total * 0.1)
        await fetch('/api/wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || ''
          },
          body: JSON.stringify({
            action: 'cashback',
            amount: coinsEarned,
            description: 'Order cashback',
            orderId: orderData.data.orderId
          })
        })

        logger.info('Order placed successfully', { orderId: orderData.data.orderId })

        // Redirect to order confirmation
        router.push(`/order/${orderData.data.orderId}`)
      } else {
        alert(orderData.error || 'Failed to place order')
      }
    } catch (error) {
      logger.error('Failed to place order', error as Error)
      alert('Failed to place order. Please try again.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
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
          <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Dine-in Indicator */}
        {isDineIn && (
          <section className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🪑</span>
              <div>
                <p className="font-semibold text-green-800">
                  Dine-in at Table {tableNumber}
                </p>
                <p className="text-sm text-green-600">
                  Your order will be sent directly to the kitchen
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Delivery Address (hidden for dine-in) */}
        {!isDineIn && (
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Address</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Address
              </label>
              <textarea
                value={address.address}
                onChange={(e) => setAddress({ ...address, address: e.target.value })}
                placeholder="House/Flat No., Street, Landmark"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="400001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={!address.address}
                onChange={(e) => {
                  if (e.target.checked) {
                    setAddress({ ...address, address: '' })
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              I&apos;ll pick up myself (no delivery fee)
            </label>
          </div>
        </section>
        )}
          <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Address</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Address
              </label>
              <textarea
                value={address.address}
                onChange={(e) => setAddress({ ...address, address: e.target.value })}
                placeholder="House/Flat No., Street, Landmark"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="400001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={!address.address}
                onChange={(e) => {
                  if (e.target.checked) {
                    setAddress({ ...address, address: '' })
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              I'll pick up myself (no delivery fee)
            </label>
          </div>
        </section>

        {/* Order Items */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Order Summary ({cart.items.length} items)
          </h2>
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={60}
                    height={60}
                    className="w-15 h-15 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Method */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>
          <div className="space-y-3">
            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
              paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="payment"
                value="upi"
                checked={paymentMethod === 'upi'}
                onChange={() => setPaymentMethod('upi')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-2xl" aria-hidden="true">📱</span>
              <div className="flex-1">
                <span className="font-medium">UPI / Google Pay / PhonePe</span>
                <p className="text-sm text-gray-500">Pay instantly</p>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
              paymentMethod === 'cod' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-2xl" aria-hidden="true">💵</span>
              <div className="flex-1">
                <span className="font-medium">Cash on Delivery</span>
                <p className="text-sm text-gray-500">Pay when you receive</p>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
              useWallet ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="checkbox"
                checked={useWallet}
                onChange={(e) => setUseWallet(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-2xl" aria-hidden="true">🪙</span>
              <div className="flex-1">
                <span className="font-medium">REZ Coins ({formatPrice(walletBalance)} available)</span>
                <p className="text-sm text-gray-500">Use up to 10% of order value</p>
              </div>
              {useWallet && (
                <span className="text-green-600 font-medium">
                  -{formatPrice(coinDiscount)}
                </span>
              )}
            </label>
          </div>
        </section>

        {/* Price Breakdown */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Price Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Item Total</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (5% GST)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Fee</span>
              <span>{address.address ? formatPrice(deliveryFee) : 'FREE'}</span>
            </div>
            {useWallet && coinDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>REZ Coins Discount</span>
                <span>-{formatPrice(coinDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-3 border-t">
              <span>Total</span>
              <span className="text-green-600">{formatPrice(total)}</span>
            </div>
          </div>
        </section>

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder || cart.items.length === 0}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlacingOrder ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Placing Order...
            </span>
          ) : (
            <span>Place Order • {formatPrice(total)}</span>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          By placing order, you agree to our Terms of Service and Privacy Policy
        </p>
      </main>
    </div>
  )
}

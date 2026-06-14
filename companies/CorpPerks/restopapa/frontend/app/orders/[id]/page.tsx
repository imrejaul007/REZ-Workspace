'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeftIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon,
  TruckIcon,
  CreditCardIcon,
  PrinterIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface OrderItem {
  id: number
  name: string
  quantity: number
  price: number
  image: string
  vendor: string
}

interface OrderDetails {
  orderNumber: string
  date: string
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  total: number
  tax: number
  deliveryFee: number
  subtotal: number
  items: OrderItem[]
  restaurant: {
    name: string
    address: string
    phone: string
  }
  deliveryAddress: {
    street: string
    city: string
    zipCode: string
    instructions?: string
  }
  paymentMethod: string
  estimatedDelivery: string
  trackingUpdates: {
    time: string
    status: string
    description: string
    completed: boolean
  }[]
}

const mockOrderData: OrderDetails = {
  orderNumber: 'ORD-2024-001234',
  date: '2024-03-15T14:30:00Z',
  status: 'out_for_delivery',
  total: 87.45,
  tax: 7.45,
  deliveryFee: 5.99,
  subtotal: 73.01,
  items: [
    {
      id: 1,
      name: 'Organic Tomatoes',
      quantity: 5,
      price: 15.00,
      image: '🍅',
      vendor: 'Fresh Farm Supplies'
    },
    {
      id: 2,
      name: 'Premium Olive Oil',
      quantity: 2,
      price: 24.99,
      image: '🫒',
      vendor: 'Mediterranean Imports'
    },
    {
      id: 3,
      name: 'Fresh Basil',
      quantity: 3,
      price: 8.50,
      image: '🌿',
      vendor: 'Herb Garden Co'
    }
  ],
  restaurant: {
    name: 'Bistro Italiano',
    address: '123 Main Street, Downtown',
    phone: '+1 (555) 123-4567'
  },
  deliveryAddress: {
    street: '456 Oak Avenue',
    city: 'New York, NY',
    zipCode: '10001',
    instructions: 'Leave at front desk'
  },
  paymentMethod: 'Credit Card ending in 4242',
  estimatedDelivery: '3:15 PM - 3:45 PM',
  trackingUpdates: [
    {
      time: '2:30 PM',
      status: 'Order Placed',
      description: 'Your order has been received and is being processed',
      completed: true
    },
    {
      time: '2:45 PM',
      status: 'Order Confirmed',
      description: 'Restaurant has confirmed your order',
      completed: true
    },
    {
      time: '3:00 PM',
      status: 'Preparing',
      description: 'Your order is being prepared',
      completed: true
    },
    {
      time: '3:15 PM',
      status: 'Out for Delivery',
      description: 'Your order is on the way',
      completed: true
    },
    {
      time: '3:30 PM',
      status: 'Delivered',
      description: 'Order delivered to your address',
      completed: false
    }
  ]
}

export default function OrderDetails() {
  const router = useRouter()
  const params = useParams()
  const [orderData] = useState<OrderDetails>(mockOrderData)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'confirmed': return 'text-blue-600 bg-blue-100'
      case 'preparing': return 'text-orange-600 bg-orange-100'
      case 'out_for_delivery': return 'text-purple-600 bg-purple-100'
      case 'delivered': return 'text-green-600 bg-green-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return ClockIcon
      case 'confirmed': return CheckCircleIcon
      case 'preparing': return ClockIcon
      case 'out_for_delivery': return TruckIcon
      case 'delivered': return CheckCircleIcon
      case 'cancelled': return ExclamationTriangleIcon
      default: return ClockIcon
    }
  }

  const StatusIcon = getStatusIcon(orderData.status)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                <p className="text-gray-600 mt-1">Order #{orderData.orderNumber}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <PrinterIcon className="w-4 h-4" />
                Print
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${getStatusColor(orderData.status)}`}>
                <StatusIcon className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900 capitalize">
                  {orderData.status.replace('_', ' ')}
                </h2>
                <p className="text-gray-600">
                  Estimated delivery: {orderData.estimatedDelivery}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-medium">
                {new Date(orderData.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="space-y-4">
            {orderData.trackingUpdates.map((update, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex-shrink-0 w-3 h-3 rounded-full ${
                  update.completed ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <div className={`ml-4 flex-1 ${index < orderData.trackingUpdates.length - 1 ? 'pb-4 border-l-2 border-gray-200 ml-1.5 pl-6' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${update.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                        {update.status}
                      </p>
                      <p className={`text-sm ${update.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                        {update.description}
                      </p>
                    </div>
                    <span className={`text-sm ${update.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                      {update.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {orderData.items.map((item) => (
                    <div key={item.id} className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                        {item.image}
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.vendor}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          ${(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">🍽️</span>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{orderData.restaurant.name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <p className="text-gray-600">{orderData.restaurant.address}</p>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <p className="text-gray-600">{orderData.restaurant.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary & Delivery Info */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${orderData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">${orderData.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${orderData.tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-semibold text-gray-900">${orderData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
              <div className="flex items-center">
                <CreditCardIcon className="w-6 h-6 text-gray-400 mr-3" />
                <span className="text-gray-600">{orderData.paymentMethod}</span>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-gray-900">{orderData.deliveryAddress.street}</p>
                    <p className="text-gray-600">{orderData.deliveryAddress.city} {orderData.deliveryAddress.zipCode}</p>
                    {orderData.deliveryAddress.instructions && (
                      <p className="text-sm text-gray-500 mt-1">
                        <strong>Instructions:</strong> {orderData.deliveryAddress.instructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useRouter } from 'next/navigation'
import { 
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  HomeIcon
} from '@heroicons/react/24/outline'

const orderDetails = {
  orderNumber: 'ORD-2024-000123',
  orderDate: new Date().toLocaleDateString(),
  estimatedDelivery: 'Tomorrow, 2-4 PM',
  total: 74.45,
  deliveryAddress: {
    businessName: 'Ocean View Restaurant',
    contactPerson: 'John Smith',
    address: '123 Main Street, Miami Beach, FL 33139',
    phone: '(555) 123-4567'
  },
  items: [
    {
      id: '1',
      name: 'Premium Organic Tomatoes',
      vendor: 'Fresh Farm Supplies',
      image: '🍅',
      quantity: 3,
      price: 12.99
    },
    {
      id: '2',
      name: 'Organic Bell Peppers',
      vendor: 'Garden Fresh Co.',
      image: '🫑',
      quantity: 2,
      price: 8.99
    },
    {
      id: '4',
      name: 'Artisan Olive Oil',
      vendor: 'Mediterranean Imports',
      image: '🫒',
      quantity: 1,
      price: 24.99
    }
  ]
}

export default function CheckoutSuccess() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600">
            Thank you for your order. We've received it and will begin processing shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Order Number</h3>
                  <p className="text-lg font-semibold text-gray-900">{orderDetails.orderNumber}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Order Date</h3>
                  <p className="text-lg font-semibold text-gray-900">{orderDetails.orderDate}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total Amount</h3>
                  <p className="text-lg font-semibold text-gray-900">${orderDetails.total.toFixed(2)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Estimated Delivery</h3>
                  <div className="flex items-center gap-2">
                    <TruckIcon className="w-4 h-4 text-green-500" />
                    <p className="text-lg font-semibold text-green-600">{orderDetails.estimatedDelivery}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
              
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">{orderDetails.deliveryAddress.businessName}</p>
                <p className="text-gray-700">Attention: {orderDetails.deliveryAddress.contactPerson}</p>
                <p className="text-gray-700">{orderDetails.deliveryAddress.address}</p>
                <div className="flex items-center gap-2 text-gray-700">
                  <PhoneIcon className="w-4 h-4" />
                  <span>{orderDetails.deliveryAddress.phone}</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              
              <div className="space-y-4">
                {orderDetails.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">{item.image}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.vendor}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Qty: {item.quantity}</p>
                      <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">What happens next?</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Order Processing</h4>
                    <p className="text-blue-800 text-sm">We'll prepare your items and confirm availability with our vendors.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Order Dispatch</h4>
                    <p className="text-blue-800 text-sm">Your order will be picked up from our vendors and prepared for delivery.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Delivery</h4>
                    <p className="text-blue-800 text-sm">Our delivery team will bring your order directly to your restaurant.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Confirmation Email */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <EnvelopeIcon className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Confirmation Email</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                A confirmation email with your order details has been sent to your email address.
              </p>
              <div className="text-xs text-gray-500">
                <p>Didn't receive it? Check your spam folder or contact support.</p>
              </div>
            </div>

            {/* Order Tracking */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <ClockIcon className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Track Your Order</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                You can track your order status and delivery progress in real-time.
              </p>
              <button 
                onClick={() => router.push('/dashboard/restaurant?section=orders')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                View Order Status
              </button>
            </div>

            {/* Support */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <PhoneIcon className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Our support team is here to help with any questions about your order.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4" />
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="w-4 h-4" />
                  <span>support@restauranthub.com</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/marketplace')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  <span className="text-gray-700">Continue Shopping</span>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                </button>
                
                <button
                  onClick={() => router.push('/dashboard/restaurant')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  <div className="flex items-center gap-2">
                    <HomeIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">Go to Dashboard</span>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                </button>
                
                <button
                  onClick={() => router.push(`/orders/${orderDetails.orderNumber}`)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">View Receipt</span>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
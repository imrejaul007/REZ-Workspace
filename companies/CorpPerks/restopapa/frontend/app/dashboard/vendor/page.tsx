'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChartBarIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  TruckIcon,
  StarIcon,
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

const navigationItems = [
  { name: 'Dashboard', icon: ChartBarIcon, id: 'dashboard' },
  { name: 'Products', icon: ShoppingBagIcon, id: 'products' },
  { name: 'Orders', icon: TruckIcon, id: 'orders' },
  { name: 'Analytics', icon: ChartBarIcon, id: 'analytics' },
  { name: 'Reviews', icon: StarIcon, id: 'reviews' },
  { name: 'Settings', icon: CogIcon, id: 'settings' },
]

// Mock data for vendor dashboard
const dashboardStats = [
  { label: 'Total Products', value: '127', change: '+8.2%', trend: 'up' },
  { label: 'Orders This Month', value: '43', change: '+15.3%', trend: 'up' },
  { label: 'Revenue', value: '₹2,34,567', change: '+22.1%', trend: 'up' },
  { label: 'Average Rating', value: '4.7', change: '+0.2', trend: 'up' },
]

const recentOrders = [
  { id: 'ORD-001', restaurant: 'Spice Garden', items: '15 items', amount: '₹12,450', status: 'confirmed', date: '2 hours ago' },
  { id: 'ORD-002', restaurant: 'Ocean Grill', items: '8 items', amount: '₹8,200', status: 'processing', date: '5 hours ago' },
  { id: 'ORD-003', restaurant: 'Tasty Bites', items: '22 items', amount: '₹18,900', status: 'delivered', date: '1 day ago' },
  { id: 'ORD-004', restaurant: 'Food Paradise', items: '12 items', amount: '₹9,800', status: 'pending', date: '2 days ago' },
]

const topProducts = [
  { name: 'Premium Basmati Rice 25kg', sales: 156, revenue: '₹78,000', stock: 45 },
  { name: 'Fresh Chicken Breast 1kg', sales: 89, revenue: '₹35,600', stock: 23 },
  { name: 'Organic Vegetables Mix', sales: 67, revenue: '₹20,100', stock: 78 },
  { name: 'Spice Combo Pack', sales: 134, revenue: '₹26,800', stock: 92 },
]

const recentReviews = [
  { restaurant: 'Spice Garden', rating: 5, comment: 'Excellent quality products, fast delivery!', date: '1 day ago' },
  { restaurant: 'Ocean Grill', rating: 4, comment: 'Good quality but packaging could be better.', date: '3 days ago' },
  { restaurant: 'Tasty Bites', rating: 5, comment: 'Always reliable, great prices!', date: '5 days ago' },
]

export default function VendorDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-blue-600 bg-blue-100'
      case 'processing': return 'text-yellow-600 bg-yellow-100'
      case 'delivered': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'} mt-2`}>
                  {stat.change} from last month
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <button 
                onClick={() => setActiveSection('orders')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{order.id}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{order.restaurant} • {order.items}</p>
                    <p className="text-xs text-gray-500">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{order.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
              <button 
                onClick={() => setActiveSection('products')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600">{product.sales} sales</span>
                      <span className="text-sm text-gray-600">Stock: {product.stock}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{product.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Reviews</h3>
            <button 
              onClick={() => setActiveSection('reviews')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentReviews.map((review, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{review.restaurant}</span>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <StarSolidIcon
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{review.comment}</p>
                <p className="text-xs text-gray-500">{review.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Products</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <PlusIcon className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topProducts.map((product, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  <div className="bg-gray-200 rounded-lg flex items-center justify-center">
                    <ShoppingBagIcon className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span>Sales: {product.sales}</span>
                  <span>Stock: {product.stock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{product.revenue}</span>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-blue-600 hover:text-blue-700">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-600 hover:text-gray-700">
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:text-red-700">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderOrders = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Orders</h2>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-6 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <span className="font-semibold text-gray-900">{order.id}</span>
                    <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-1">{order.restaurant}</p>
                  <p className="text-sm text-gray-500">{order.items} • {order.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-gray-900 mb-2">{order.amount}</p>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard()
      case 'products': return renderProducts()
      case 'orders': return renderOrders()
      case 'analytics': return <div className="text-center py-12 text-gray-500">Analytics coming soon...</div>
      case 'reviews': return <div className="text-center py-12 text-gray-500">Reviews management coming soon...</div>
      case 'settings': return <div className="text-center py-12 text-gray-500">Settings coming soon...</div>
      default: return renderDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform lg:translate-x-0`}>
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">Vendor Portal</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === item.id 
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <button 
            onClick={() => router.push('/auth/login')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {navigationItems.find(item => item.id === activeSection)?.name || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <BellIcon className="w-6 h-6" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>
              <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
                <UserCircleIcon className="w-8 h-8 text-gray-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Fresh Farm Supplies</p>
                  <p className="text-xs text-gray-500">Vendor</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
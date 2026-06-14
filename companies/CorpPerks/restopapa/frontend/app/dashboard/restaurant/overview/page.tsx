'use client'

import React, { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingCart, 
  Users, 
  Star,
  Clock,
  AlertCircle,
  CheckCircle,
  Package,
  Utensils,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Eye,
  MessageSquare,
  Bell,
  Plus,
  Edit,
  RefreshCw
} from 'lucide-react'

interface RestaurantMetrics {
  todayRevenue: number
  todayOrders: number
  averageOrderValue: number
  customerSatisfaction: number
  totalMenuItems: number
  activeStaff: number
  monthlyGrowth: number
  weeklyOrders: number
}

interface RecentOrder {
  id: string
  customerName: string
  items: string[]
  total: number
  status: 'preparing' | 'ready' | 'delivered' | 'cancelled'
  orderTime: string
  deliveryTime?: string
}

interface PopularItem {
  id: string
  name: string
  category: string
  orderCount: number
  revenue: number
  rating: number
  image: string
}

const RestaurantOverview = () => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')

  // Mock restaurant data
  const restaurantInfo = {
    name: 'Spice Garden Restaurant',
    address: '123 Food Street, Mumbai, Maharashtra 400001',
    phone: '+91-9876543210',
    email: 'orders@spicegarden.com',
    status: 'open',
    rating: 4.5,
    totalReviews: 1247
  }

  const metrics: RestaurantMetrics = {
    todayRevenue: 12500,
    todayOrders: 45,
    averageOrderValue: 278,
    customerSatisfaction: 4.3,
    totalMenuItems: 156,
    activeStaff: 12,
    monthlyGrowth: 15.6,
    weeklyOrders: 286
  }

  const recentOrders: RecentOrder[] = [
    {
      id: 'ORD001',
      customerName: 'John Doe',
      items: ['Chicken Biryani', 'Raita', 'Papad'],
      total: 450,
      status: 'preparing',
      orderTime: '10 mins ago'
    },
    {
      id: 'ORD002',
      customerName: 'Sarah Johnson',
      items: ['Paneer Tikka', 'Naan', 'Dal Makhani'],
      total: 385,
      status: 'ready',
      orderTime: '15 mins ago'
    },
    {
      id: 'ORD003',
      customerName: 'Mike Wilson',
      items: ['Fish Curry', 'Rice', 'Pickle'],
      total: 320,
      status: 'delivered',
      orderTime: '25 mins ago',
      deliveryTime: '22 mins ago'
    },
    {
      id: 'ORD004',
      customerName: 'Emily Davis',
      items: ['Veg Thali', 'Lassi'],
      total: 295,
      status: 'preparing',
      orderTime: '8 mins ago'
    },
    {
      id: 'ORD005',
      customerName: 'Robert Brown',
      items: ['Butter Chicken', 'Garlic Naan'],
      total: 425,
      status: 'ready',
      orderTime: '12 mins ago'
    }
  ]

  const popularItems: PopularItem[] = [
    {
      id: 'item-1',
      name: 'Chicken Biryani',
      category: 'Main Course',
      orderCount: 23,
      revenue: 8970,
      rating: 4.7,
      image: '/api/placeholder/60/60'
    },
    {
      id: 'item-2',
      name: 'Butter Chicken',
      category: 'Main Course',
      orderCount: 18,
      revenue: 6840,
      rating: 4.5,
      image: '/api/placeholder/60/60'
    },
    {
      id: 'item-3',
      name: 'Paneer Tikka',
      category: 'Appetizer',
      orderCount: 15,
      revenue: 4200,
      rating: 4.6,
      image: '/api/placeholder/60/60'
    },
    {
      id: 'item-4',
      name: 'Garlic Naan',
      category: 'Bread',
      orderCount: 28,
      revenue: 2240,
      rating: 4.4,
      image: '/api/placeholder/60/60'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing': return 'bg-yellow-100 text-yellow-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'preparing': return <Clock className="h-4 w-4" />
      case 'ready': return <CheckCircle className="h-4 w-4" />
      case 'delivered': return <Package className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Dashboard</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{restaurantInfo.name}</span>
                <span>•</span>
                <span className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  {restaurantInfo.rating} ({restaurantInfo.totalReviews} reviews)
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  Open
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{metrics.todayRevenue.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+{metrics.monthlyGrowth}%</span>
              <span className="text-sm text-gray-500 ml-1">from last month</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.todayOrders}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {metrics.weeklyOrders} orders this week
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">₹{metrics.averageOrderValue}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Target: ₹300
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Rating</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.customerSatisfaction}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Based on recent reviews
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">#{order.id}</span>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{order.customerName}</p>
                      <p className="text-xs text-gray-500">
                        {order.items.join(', ')}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-medium text-gray-900">₹{order.total}</span>
                        <span className="text-xs text-gray-500">{order.orderTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-1 text-gray-400 hover:text-blue-600">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Items */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Popular Items Today</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View Menu</button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {popularItems.map((item, index) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-12 w-12 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        #{index + 1} {item.name}
                      </p>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                        <span className="text-xs text-gray-500">{item.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{item.category}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-900">{item.orderCount} orders</span>
                      <span className="text-sm font-medium text-green-600">₹{item.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Utensils className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Menu Items</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalMenuItems}</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              12 items out of stock
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Staff</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.activeStaff}</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              15 total employees
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Reviews</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              3 pending responses
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Plus className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Add Menu Item</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Staff Schedule</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <BarChart3 className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">View Reports</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Bell className="h-6 w-6 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Notifications</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <MessageSquare className="h-6 w-6 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Reviews</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <ShoppingCart className="h-6 w-6 text-red-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Marketplace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RestaurantOverview
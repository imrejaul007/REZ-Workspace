'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  ShoppingCartIcon,
  CurrencyRupeeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BellIcon,
  UserCircleIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  EyeIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  FireIcon,
  SparklesIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

const navigationItems = [
  { name: 'Dashboard', icon: ChartBarIcon, id: 'dashboard' },
  { name: 'Orders', icon: ShoppingCartIcon, id: 'orders' },
  { name: 'Employees', icon: UsersIcon, id: 'employees' },
  { name: 'Analytics', icon: DocumentChartBarIcon, id: 'analytics' },
  { name: 'Settings', icon: CogIcon, id: 'settings' },
]

// Mock data for restaurant dashboard
const dashboardStats = [
  {
    label: "Today's Orders",
    value: '47',
    change: '+12%',
    trend: 'up',
    icon: ShoppingCartIcon,
    color: 'blue'
  },
  {
    label: 'Today\'s Revenue',
    value: '₹12,450',
    change: '+8%',
    trend: 'up',
    icon: CurrencyRupeeIcon,
    color: 'green'
  },
  {
    label: 'Active Staff',
    value: '12',
    change: '-2%',
    trend: 'down',
    icon: UsersIcon,
    color: 'purple'
  },
  {
    label: 'Pending Tasks',
    value: '5',
    change: '-15%',
    trend: 'down',
    icon: ClipboardDocumentListIcon,
    color: 'orange'
  },
]

const recentOrders = [
  {
    id: 'ORD-7845',
    customer: 'Rahul Sharma',
    items: '3 items',
    amount: '₹850',
    status: 'preparing',
    time: '12 mins ago',
    type: 'delivery'
  },
  {
    id: 'ORD-7844',
    customer: 'Priya Patel',
    items: '5 items',
    amount: '₹1,250',
    status: 'ready',
    time: '18 mins ago',
    type: 'pickup'
  },
  {
    id: 'ORD-7843',
    customer: 'Amit Kumar',
    items: '2 items',
    amount: '₹450',
    status: 'delivered',
    time: '35 mins ago',
    type: 'delivery'
  },
  {
    id: 'ORD-7842',
    customer: 'Sneha Reddy',
    items: '4 items',
    amount: '₹980',
    status: 'confirmed',
    time: '45 mins ago',
    type: 'dine-in'
  },
  {
    id: 'ORD-7841',
    customer: 'Vikram Singh',
    items: '6 items',
    amount: '₹1,890',
    status: 'preparing',
    time: '1 hour ago',
    type: 'delivery'
  },
]

const weeklyRevenue = [
  { day: 'Mon', value: 8500 },
  { day: 'Tue', value: 9200 },
  { day: 'Wed', value: 7800 },
  { day: 'Thu', value: 10500 },
  { day: 'Fri', value: 12400 },
  { day: 'Sat', value: 15800 },
  { day: 'Sun', value: 14200 },
]

const quickActions = [
  { name: 'Add New Order', icon: PlusIcon, color: 'bg-blue-500', description: 'Create manual order' },
  { name: 'View Menu', icon: ClipboardDocumentListIcon, color: 'bg-green-500', description: 'Manage dishes' },
  { name: 'Staff Schedule', icon: CalendarIcon, color: 'bg-purple-500', description: 'Shift management' },
  { name: 'Generate Report', icon: DocumentChartBarIcon, color: 'bg-orange-500', description: 'Download analytics' },
]

const popularDishes = [
  { name: 'Butter Chicken', orders: 45, revenue: '₹11,250' },
  { name: 'Paneer Tikka', orders: 38, revenue: '₹7,600' },
  { name: 'Biryani Special', orders: 32, revenue: '₹9,600' },
  { name: 'Garlic Naan', orders: 56, revenue: '₹5,600' },
]

export default function RestaurantDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications] = useState(4)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing': return 'text-orange-600 bg-orange-100'
      case 'ready': return 'text-blue-600 bg-blue-100'
      case 'delivered': return 'text-green-600 bg-green-100'
      case 'confirmed': return 'text-purple-600 bg-purple-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'delivery': return <TruckIcon className="w-4 h-4" />
      case 'pickup': return <ShoppingCartIcon className="w-4 h-4" />
      case 'dine-in': return <StarIcon className="w-4 h-4" />
      default: return <ShoppingCartIcon className="w-4 h-4" />
    }
  }

  const maxRevenue = Math.max(...weeklyRevenue.map(d => d.value))

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, Tasty Bites!</h1>
          <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening at your restaurant today.</p>
        </div>
        <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium">Open for Business</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.trend === 'up' ? (
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs yesterday</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
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
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-lg border">
                      <span className="text-xs text-gray-500">{getTypeIcon(order.type)}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">{order.id}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{order.customer} - {order.items}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {order.time}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{order.amount}</p>
                    <button className="text-blue-600 hover:text-blue-700 text-sm mt-1">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & Popular Dishes - Takes 1 column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={index}
                    className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className={`p-3 rounded-lg ${action.color} mb-2`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{action.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Popular Dishes */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Dishes</h3>
            <div className="space-y-3">
              {popularDishes.map((dish, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <FireIcon className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{dish.name}</p>
                      <p className="text-xs text-gray-500">{dish.orders} orders</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{dish.revenue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Revenue</h3>
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">Total:</span>
            <span className="font-semibold text-gray-900">₹{weeklyRevenue.reduce((sum, d) => sum + d.value, 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-end justify-between h-48 gap-2">
          {weeklyRevenue.map((day, index) => (
            <motion.div
              key={index}
              initial={{ height: 0 }}
              animate={{ height: `${(day.value / maxRevenue) * 100}%` }}
              transition={{ delay: index * 0.1, type: 'spring' }}
              className="flex-1 flex flex-col items-center"
            >
              <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg relative group cursor-pointer">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  ₹{day.value.toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-xs text-gray-500">
          {weeklyRevenue.map((day, index) => (
            <span key={index}>{day.day}</span>
          ))}
        </div>
      </div>
    </div>
  )

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
        <div className="flex space-x-3">
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>All Orders</option>
            <option>Preparing</option>
            <option>Ready</option>
            <option>Delivered</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <PlusIcon className="w-5 h-5" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
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
                  <p className="text-gray-600 mb-1">{order.customer}</p>
                  <p className="text-sm text-gray-500">{order.items} - {order.time}</p>
                </div>
                <div className="text-right mr-6">
                  <p className="text-xl font-semibold text-gray-900">{order.amount}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderEmployees = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <PlusIcon className="w-5 h-5" />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { name: 'Rajesh Kumar', role: 'Head Chef', status: 'on-duty', avatar: '👨‍🍳' },
          { name: 'Priya Sharma', role: 'Manager', status: 'on-duty', avatar: '👩‍💼' },
          { name: 'Amit Singh', role: 'Waiter', status: 'off-duty', avatar: '🧑‍🍳' },
          { name: 'Sneha Verma', role: 'Waiter', status: 'on-duty', avatar: '👩‍🍳' },
        ].map((employee, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl mb-4">
                {employee.avatar}
              </div>
              <h3 className="font-semibold text-gray-900">{employee.name}</h3>
              <p className="text-sm text-gray-500">{employee.role}</p>
              <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                employee.status === 'on-duty' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {employee.status === 'on-duty' ? 'On Duty' : 'Off Duty'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Overview</h3>
          <div className="flex items-end justify-between h-48 gap-2">
            {weeklyRevenue.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t-lg"
                  style={{ height: `${(day.value / maxRevenue) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-500">
            {weeklyRevenue.map((day, index) => (
              <span key={index}>{day.day}</span>
            ))}
          </div>
        </div>

        {/* Order Statistics */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TruckIcon className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700">Delivery Orders</span>
              </div>
              <span className="font-semibold text-gray-900">65%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <ShoppingCartIcon className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Pickup Orders</span>
              </div>
              <span className="font-semibold text-gray-900">25%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <StarIcon className="w-5 h-5 text-purple-500" />
                <span className="text-gray-700">Dine-In Orders</span>
              </div>
              <span className="font-semibold text-gray-900">10%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500">Restaurant settings and configuration coming soon...</p>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard()
      case 'orders': return renderOrders()
      case 'employees': return renderEmployees()
      case 'analytics': return renderAnalytics()
      case 'settings': return renderSettings()
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
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">TB</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Tasty Bites</h1>
              <p className="text-xs text-gray-500">Restaurant Dashboard</p>
            </div>
          </div>
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
          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                🏪
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Tasty Bites</p>
                <p className="text-xs text-gray-500">Premium Plan</p>
              </div>
            </div>
          </div>
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
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-gray-900">Manager</p>
                  <p className="text-xs text-gray-500">Tasty Bites</p>
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

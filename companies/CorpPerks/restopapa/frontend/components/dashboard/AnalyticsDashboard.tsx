'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, Users, ShoppingCart, DollarSign,
  Calendar, ArrowUp, ArrowDown, Activity,
  BarChart3, PieChart, LineChart, Map
} from 'lucide-react'
import { AnimatedStatCard } from '../ui/AnimatedCard'

interface DashboardProps {
  userRole: 'admin' | 'restaurant' | 'employee' | 'vendor'
}

export function AnalyticsDashboard({ userRole }: DashboardProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('month')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Sample data based on role
  const getStatsForRole = () => {
    switch (userRole) {
      case 'admin':
        return [
          { title: 'Total Users', value: '12,543', icon: <Users className="w-6 h-6" />, trend: 'up', trendValue: '12%', color: 'primary' as const },
          { title: 'Total Revenue', value: '₹45.8L', icon: <DollarSign className="w-6 h-6" />, trend: 'up', trendValue: '8%', color: 'success' as const },
          { title: 'Active Orders', value: '3,241', icon: <ShoppingCart className="w-6 h-6" />, trend: 'up', trendValue: '23%', color: 'warning' as const },
          { title: 'Growth Rate', value: '18.2%', icon: <TrendingUp className="w-6 h-6" />, trend: 'up', trendValue: '5%', color: 'primary' as const }
        ]
      case 'restaurant':
        return [
          { title: 'Today\'s Orders', value: '87', icon: <ShoppingCart className="w-6 h-6" />, trend: 'up', trendValue: '15%', color: 'primary' as const },
          { title: 'Revenue', value: '₹28,450', icon: <DollarSign className="w-6 h-6" />, trend: 'up', trendValue: '10%', color: 'success' as const },
          { title: 'Active Staff', value: '24', icon: <Users className="w-6 h-6" />, trend: 'down', trendValue: '2%', color: 'warning' as const },
          { title: 'Avg Rating', value: '4.8', icon: <Activity className="w-6 h-6" />, trend: 'up', trendValue: '0.3', color: 'primary' as const }
        ]
      case 'employee':
        return [
          { title: 'Applications', value: '12', icon: <ShoppingCart className="w-6 h-6" />, trend: 'up', trendValue: '3', color: 'primary' as const },
          { title: 'Profile Views', value: '234', icon: <Users className="w-6 h-6" />, trend: 'up', trendValue: '45', color: 'success' as const },
          { title: 'Messages', value: '8', icon: <Activity className="w-6 h-6" />, trend: 'up', trendValue: '2', color: 'warning' as const },
          { title: 'Score', value: '92%', icon: <TrendingUp className="w-6 h-6" />, trend: 'up', trendValue: '5%', color: 'primary' as const }
        ]
      case 'vendor':
        return [
          { title: 'Products', value: '156', icon: <ShoppingCart className="w-6 h-6" />, trend: 'up', trendValue: '8', color: 'primary' as const },
          { title: 'Orders', value: '423', icon: <Activity className="w-6 h-6" />, trend: 'up', trendValue: '34', color: 'success' as const },
          { title: 'Revenue', value: '₹1.2L', icon: <DollarSign className="w-6 h-6" />, trend: 'up', trendValue: '12%', color: 'warning' as const },
          { title: 'Customers', value: '89', icon: <Users className="w-6 h-6" />, trend: 'up', trendValue: '7', color: 'primary' as const }
        ]
      default:
        return []
    }
  }

  const stats = getStatsForRole()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your performance and growth metrics
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          {/* Time Range Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 flex gap-1 shadow-md">
            {(['today', 'week', 'month', 'year'] as const).map((range) => (
              <motion.button
                key={range}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeRange(range)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium capitalize
                  transition-colors duration-200
                  ${timeRange === range
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                {range}
              </motion.button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 flex gap-1 shadow-md">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('grid')}
              className={`
                p-2 rounded-md
                ${viewMode === 'grid'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <BarChart3 className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('list')}
              className={`
                p-2 rounded-md
                ${viewMode === 'list'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <LineChart className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <AnimatedStatCard
            key={stat.title}
            {...stat}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Revenue Overview
            </h3>
            <LineChart className="w-5 h-5 text-gray-500" />
          </div>
          <RevenueChart timeRange={timeRange} />
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Category Distribution
            </h3>
            <PieChart className="w-5 h-5 text-gray-500" />
          </div>
          <CategoryChart />
        </motion.div>
      </div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
          <Activity className="w-5 h-5 text-gray-500" />
        </div>
        <ActivityTimeline userRole={userRole} />
      </motion.div>
    </div>
  )
}

// Sample Chart Components
function RevenueChart({ timeRange }: { timeRange: string }) {
  const data = {
    today: [2000, 2400, 2200, 2800, 3200, 2900, 3500],
    week: [12000, 14000, 13000, 15000, 16000, 14500, 17000],
    month: [45000, 52000, 48000, 58000, 62000, 55000, 68000],
    year: [450000, 520000, 480000, 580000, 620000, 550000, 680000]
  }

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const values = data[timeRange as keyof typeof data]

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between h-48 gap-2">
        {values.map((value, index) => (
          <motion.div
            key={index}
            initial={{ height: 0 }}
            animate={{ height: `${(value / Math.max(...values)) * 100}%` }}
            transition={{ delay: index * 0.1, type: 'spring' }}
            className="flex-1 bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-lg relative group"
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-2 py-1 rounded text-xs">
              ₹{(value / 1000).toFixed(1)}K
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        {labels.map(label => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  )
}

function CategoryChart() {
  const categories = [
    { name: 'Food & Beverages', value: 45, color: 'bg-primary-500' },
    { name: 'Equipment', value: 25, color: 'bg-success-500' },
    { name: 'Services', value: 20, color: 'bg-warning-500' },
    { name: 'Others', value: 10, color: 'bg-danger-500' }
  ]

  return (
    <div className="space-y-4">
      {categories.map((category, index) => (
        <motion.div
          key={category.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="space-y-2"
        >
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">{category.name}</span>
            <span className="font-semibold text-gray-900 dark:text-white">{category.value}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${category.value}%` }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              className={`h-full ${category.color} rounded-full`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function ActivityTimeline({ userRole }: { userRole: string }) {
  const activities = {
    admin: [
      { time: '2 mins ago', action: 'New restaurant registered', icon: <Users className="w-4 h-4" /> },
      { time: '15 mins ago', action: 'System backup completed', icon: <Activity className="w-4 h-4" /> },
      { time: '1 hour ago', action: '₹45,000 payment processed', icon: <DollarSign className="w-4 h-4" /> },
      { time: '3 hours ago', action: '12 new job listings posted', icon: <ShoppingCart className="w-4 h-4" /> }
    ],
    restaurant: [
      { time: '5 mins ago', action: 'New order received', icon: <ShoppingCart className="w-4 h-4" /> },
      { time: '30 mins ago', action: 'Staff schedule updated', icon: <Calendar className="w-4 h-4" /> },
      { time: '2 hours ago', action: 'Inventory restocked', icon: <Activity className="w-4 h-4" /> },
      { time: '4 hours ago', action: 'Payment received ₹12,500', icon: <DollarSign className="w-4 h-4" /> }
    ],
    employee: [
      { time: '10 mins ago', action: 'Application viewed by employer', icon: <Users className="w-4 h-4" /> },
      { time: '1 hour ago', action: 'Profile updated successfully', icon: <Activity className="w-4 h-4" /> },
      { time: '3 hours ago', action: 'New job match found', icon: <ShoppingCart className="w-4 h-4" /> },
      { time: '5 hours ago', action: 'Document verified', icon: <Calendar className="w-4 h-4" /> }
    ],
    vendor: [
      { time: '15 mins ago', action: 'New order received', icon: <ShoppingCart className="w-4 h-4" /> },
      { time: '45 mins ago', action: 'Product stock updated', icon: <Activity className="w-4 h-4" /> },
      { time: '2 hours ago', action: 'Payment processed ₹8,500', icon: <DollarSign className="w-4 h-4" /> },
      { time: '6 hours ago', action: 'New review received', icon: <Users className="w-4 h-4" /> }
    ]
  }

  const items = activities[userRole as keyof typeof activities] || []

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
            {item.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {item.action}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {item.time}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
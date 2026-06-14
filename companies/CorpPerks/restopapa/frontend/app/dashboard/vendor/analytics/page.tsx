'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ClockIcon,
  EyeIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  revenue: {
    total: number
    change: number
    trend: 'up' | 'down'
  }
  orders: {
    total: number
    change: number
    trend: 'up' | 'down'
  }
  customers: {
    total: number
    change: number
    trend: 'up' | 'down'
  }
  avgOrderValue: {
    value: number
    change: number
    trend: 'up' | 'down'
  }
}

interface ChartData {
  period: string
  revenue: number
  orders: number
  customers: number
}

interface ProductPerformance {
  id: string
  name: string
  revenue: number
  orders: number
  views: number
  rating: number
  change: number
  trend: 'up' | 'down'
}

interface CustomerInsight {
  metric: string
  value: string
  description: string
  icon: any
}

export default function VendorAnalytics() {
  const [timeRange, setTimeRange] = useState('7d')
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenue: { total: 24580, change: 12.5, trend: 'up' },
    orders: { total: 156, change: 8.3, trend: 'up' },
    customers: { total: 89, change: 5.2, trend: 'up' },
    avgOrderValue: { value: 157.69, change: -2.1, trend: 'down' }
  })

  const chartData: ChartData[] = [
    { period: 'Mon', revenue: 3200, orders: 18, customers: 12 },
    { period: 'Tue', revenue: 4100, orders: 24, customers: 16 },
    { period: 'Wed', revenue: 2800, orders: 15, customers: 10 },
    { period: 'Thu', revenue: 3900, orders: 22, customers: 14 },
    { period: 'Fri', revenue: 4800, orders: 28, customers: 19 },
    { period: 'Sat', revenue: 3200, orders: 19, customers: 13 },
    { period: 'Sun', revenue: 2500, orders: 14, customers: 9 }
  ]

  const topProducts: ProductPerformance[] = [
    {
      id: '1',
      name: 'Organic Tomatoes',
      revenue: 2400,
      orders: 45,
      views: 320,
      rating: 4.8,
      change: 15.2,
      trend: 'up'
    },
    {
      id: '2',
      name: 'Fresh Basil',
      revenue: 1800,
      orders: 38,
      views: 280,
      rating: 4.6,
      change: 8.7,
      trend: 'up'
    },
    {
      id: '3',
      name: 'Bell Peppers',
      revenue: 1600,
      orders: 32,
      views: 250,
      rating: 4.4,
      change: -3.2,
      trend: 'down'
    },
    {
      id: '4',
      name: 'Mushroom Mix',
      revenue: 1400,
      orders: 28,
      views: 210,
      rating: 4.7,
      change: 22.1,
      trend: 'up'
    },
    {
      id: '5',
      name: 'Lettuce Hearts',
      revenue: 1200,
      orders: 25,
      views: 190,
      rating: 4.3,
      change: -1.8,
      trend: 'down'
    }
  ]

  const customerInsights: CustomerInsight[] = [
    {
      metric: 'Peak Order Hours',
      value: '11 AM - 2 PM',
      description: 'Most orders placed during lunch hours',
      icon: ClockIcon
    },
    {
      metric: 'Avg. Customer Rating',
      value: '4.6/5.0',
      description: 'Based on 234 reviews this month',
      icon: StarIcon
    },
    {
      metric: 'Return Customer Rate',
      value: '68%',
      description: 'Customers who placed multiple orders',
      icon: UserGroupIcon
    },
    {
      metric: 'Product Views',
      value: '2,840',
      description: 'Total product page views',
      icon: EyeIcon
    }
  ]

  const maxRevenue = Math.max(...chartData.map(d => d.revenue))
  const maxOrders = Math.max(...chartData.map(d => d.orders))

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Track your business performance and insights</p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">${analytics.revenue.total.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                {analytics.revenue.trend === 'up' ? (
                  <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  analytics.revenue.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(analytics.revenue.change)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.orders.total}</p>
              <div className="flex items-center mt-2">
                {analytics.orders.trend === 'up' ? (
                  <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  analytics.orders.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(analytics.orders.change)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.customers.total}</p>
              <div className="flex items-center mt-2">
                {analytics.customers.trend === 'up' ? (
                  <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  analytics.customers.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(analytics.customers.change)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Order Value</p>
              <p className="text-3xl font-bold text-gray-900">${analytics.avgOrderValue.value}</p>
              <div className="flex items-center mt-2">
                {analytics.avgOrderValue.trend === 'up' ? (
                  <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  analytics.avgOrderValue.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(analytics.avgOrderValue.change)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue & Orders Trend</h3>
            <div className="flex space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Revenue</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Orders</span>
              </div>
            </div>
          </div>
          
          <div className="h-80 flex items-end space-x-4">
            {chartData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-end h-64 mb-2">
                  <div className="flex-1 flex flex-col items-center space-y-1">
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                    ></div>
                    <div
                      className="w-full bg-green-500 rounded-t"
                      style={{ height: `${(data.orders / maxOrders) * 20}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-medium">{data.period}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Insights</h3>
          
          <div className="space-y-6">
            {customerInsights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <insight.icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900">{insight.metric}</h4>
                    <span className="text-lg font-bold text-blue-600">{insight.value}</span>
                  </div>
                  <p className="text-xs text-gray-500">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Products */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Products</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">${product.revenue.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.orders}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.views}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900">{product.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.trend === 'up' ? (
                        <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        product.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.abs(product.change)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
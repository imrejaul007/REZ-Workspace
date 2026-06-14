'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChartBarIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

interface MetricCard {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: any
}

const metrics: MetricCard[] = [
  {
    title: 'Total Revenue',
    value: '$124,500',
    change: '+12.5%',
    trend: 'up',
    icon: CurrencyDollarIcon
  },
  {
    title: 'Active Users', 
    value: '2,847',
    change: '+8.2%',
    trend: 'up',
    icon: UsersIcon
  },
  {
    title: 'Restaurants',
    value: '456',
    change: '+5.1%',
    trend: 'up',
    icon: BuildingStorefrontIcon
  },
  {
    title: 'Job Postings',
    value: '1,234',
    change: '-2.3%',
    trend: 'down', 
    icon: BriefcaseIcon
  }
]

export default function AdminReports() {
  const router = useRouter()
  const [dateRange, setDateRange] = useState('7d')
  const [reportType, setReportType] = useState('overview')

  const exportReport = (format: 'csv' | 'pdf') => {
    alert(`Exporting ${reportType} report as ${format.toUpperCase()}...`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
              <p className="text-gray-600 mt-1">Platform performance and business insights</p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="overview">Overview</option>
                <option value="users">User Analytics</option>
                <option value="restaurants">Restaurant Performance</option>
                <option value="jobs">Job Market Analysis</option>
                <option value="revenue">Revenue Reports</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => exportReport('csv')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => exportReport('pdf')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                    <div className="flex items-center mt-2">
                      {metric.trend === 'up' ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.change} from last period
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    metric.trend === 'up' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <ChartBarIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-2" />
                <p>Revenue chart would go here</p>
                <p className="text-sm">Integration with charting library needed</p>
              </div>
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
              <UsersIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <UsersIcon className="w-12 h-12 mx-auto mb-2" />
                <p>User growth chart would go here</p>
                <p className="text-sm">Integration with charting library needed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Reports */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Restaurants</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Growth
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { name: 'Ocean View Diner', revenue: '$12,500', orders: 145, rating: 4.9, growth: '+15%' },
                  { name: 'Tasty Bites', revenue: '$10,200', orders: 132, rating: 4.7, growth: '+12%' },
                  { name: 'Spice Garden', revenue: '$8,900', orders: 118, rating: 4.8, growth: '+8%' }
                ].map((restaurant, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {restaurant.revenue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {restaurant.orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {restaurant.rating}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center text-sm text-green-600">
                        <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                        {restaurant.growth}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <button
            onClick={() => router.push('/dashboard/admin/users')}
            className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left hover:bg-blue-100"
          >
            <UsersIcon className="w-8 h-8 text-blue-600 mb-3" />
            <h4 className="text-lg font-semibold text-blue-900">User Management</h4>
            <p className="text-blue-700 text-sm mt-1">View and manage all platform users</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/admin/monitoring')}
            className="bg-green-50 border border-green-200 rounded-lg p-6 text-left hover:bg-green-100"
          >
            <ChartBarIcon className="w-8 h-8 text-green-600 mb-3" />
            <h4 className="text-lg font-semibold text-green-900">System Monitoring</h4>
            <p className="text-green-700 text-sm mt-1">Monitor platform health and performance</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/admin/settings')}
            className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-left hover:bg-purple-100"
          >
            <CurrencyDollarIcon className="w-8 h-8 text-purple-600 mb-3" />
            <h4 className="text-lg font-semibold text-purple-900">Platform Settings</h4>
            <p className="text-purple-700 text-sm mt-1">Configure platform-wide settings</p>
          </button>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import {
  ChartBarIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  BriefcaseIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalUsers: { value: 12847, change: 8.2, trend: 'up' },
    totalRestaurants: { value: 1247, change: 12.1, trend: 'up' },
    totalEmployees: { value: 8934, change: 5.7, trend: 'up' },
    totalVendors: { value: 542, change: 15.3, trend: 'up' },
    activeJobs: { value: 1834, change: -2.4, trend: 'down' },
    totalOrders: { value: 23451, change: 18.9, trend: 'up' },
    revenue: { value: 2459870, change: 23.1, trend: 'up' },
    avgOrderValue: { value: 1247, change: 4.2, trend: 'up' }
  },
  userGrowth: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    datasets: [
      {
        label: 'Restaurants',
        data: [120, 145, 168, 189, 234, 287, 342, 398, 456],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true
      },
      {
        label: 'Employees',
        data: [450, 523, 612, 745, 834, 923, 1067, 1234, 1398],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true
      },
      {
        label: 'Vendors',
        data: [45, 52, 61, 74, 83, 92, 106, 123, 142],
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true
      }
    ]
  },
  revenueData: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    datasets: [
      {
        label: 'Subscription Revenue',
        data: [85000, 92000, 88000, 105000, 123000, 134000, 145000, 156000, 167000],
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      },
      {
        label: 'Marketplace Commission',
        data: [45000, 48000, 52000, 58000, 65000, 72000, 79000, 86000, 94000],
        backgroundColor: 'rgba(16, 185, 129, 0.8)'
      },
      {
        label: 'Premium Features',
        data: [15000, 18000, 21000, 24000, 27000, 30000, 33000, 36000, 39000],
        backgroundColor: 'rgba(245, 158, 11, 0.8)'
      }
    ]
  },
  userDistribution: {
    labels: ['Restaurants', 'Employees', 'Vendors', 'Admin'],
    datasets: [
      {
        data: [1247, 8934, 542, 12],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  },
  topPerformers: {
    restaurants: [
      { name: 'The Grand Hotel', orders: 1234, revenue: 234567 },
      { name: 'Spice Garden', orders: 987, revenue: 189456 },
      { name: 'Ocean Grill', orders: 756, revenue: 145623 }
    ],
    employees: [
      { name: 'John Smith', applications: 45, hireRate: 78 },
      { name: 'Maria Rodriguez', applications: 38, hireRate: 82 },
      { name: 'David Chen', applications: 32, hireRate: 75 }
    ],
    vendors: [
      { name: 'Fresh Farm Supplies', orders: 567, revenue: 123456 },
      { name: 'Kitchen Equipment Pro', orders: 423, revenue: 98765 },
      { name: 'Packaging Solutions', orders: 389, revenue: 87654 }
    ]
  }
}

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  const StatCard = ({ title, value, change, trend, icon: Icon, format = 'number' }: any) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {format === 'currency' ? formatCurrency(value) : formatNumber(value)}
          </p>
          <div className={`flex items-center mt-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? (
              <ArrowUpIcon className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 mr-1" />
            )}
            <span className="text-sm font-medium">{Math.abs(change)}%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        <div className={`p-3 rounded-full ${
          trend === 'up' ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <Icon className={`w-6 h-6 ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`} />
        </div>
      </div>
    </div>
  )

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor platform performance and user engagement</p>
          </div>
          
          <div className="flex items-center space-x-4">
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
            
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'users', name: 'Users', icon: UsersIcon },
              { id: 'revenue', name: 'Revenue', icon: ArrowTrendingUpIcon },
              { id: 'marketplace', name: 'Marketplace', icon: ShoppingCartIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={mockAnalytics.overview.totalUsers.value}
                change={mockAnalytics.overview.totalUsers.change}
                trend={mockAnalytics.overview.totalUsers.trend}
                icon={UsersIcon}
              />
              <StatCard
                title="Active Restaurants"
                value={mockAnalytics.overview.totalRestaurants.value}
                change={mockAnalytics.overview.totalRestaurants.change}
                trend={mockAnalytics.overview.totalRestaurants.trend}
                icon={BuildingStorefrontIcon}
              />
              <StatCard
                title="Total Revenue"
                value={mockAnalytics.overview.revenue.value}
                change={mockAnalytics.overview.revenue.change}
                trend={mockAnalytics.overview.revenue.trend}
                icon={ArrowTrendingUpIcon}
                format="currency"
              />
              <StatCard
                title="Active Jobs"
                value={mockAnalytics.overview.activeJobs.value}
                change={mockAnalytics.overview.activeJobs.change}
                trend={mockAnalytics.overview.activeJobs.trend}
                icon={BriefcaseIcon}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
                <div className="h-80">
                  <Line data={mockAnalytics.userGrowth} options={chartOptions} />
                </div>
              </div>

              {/* User Distribution */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
                <div className="h-80">
                  <Doughnut 
                    data={mockAnalytics.userDistribution} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Restaurants */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Restaurants</h3>
                <div className="space-y-4">
                  {mockAnalytics.topPerformers.restaurants.map((restaurant, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{restaurant.name}</p>
                        <p className="text-sm text-gray-500">{restaurant.orders} orders</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(restaurant.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Employees */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Employees</h3>
                <div className="space-y-4">
                  {mockAnalytics.topPerformers.employees.map((employee, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{employee.name}</p>
                        <p className="text-sm text-gray-500">{employee.applications} applications</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {employee.hireRate}% hire rate
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Vendors */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Vendors</h3>
                <div className="space-y-4">
                  {mockAnalytics.topPerformers.vendors.map((vendor, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{vendor.name}</p>
                        <p className="text-sm text-gray-500">{vendor.orders} orders</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(vendor.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Revenue"
                value={mockAnalytics.overview.revenue.value}
                change={mockAnalytics.overview.revenue.change}
                trend={mockAnalytics.overview.revenue.trend}
                icon={ArrowTrendingUpIcon}
                format="currency"
              />
              <StatCard
                title="Avg Order Value"
                value={mockAnalytics.overview.avgOrderValue.value}
                change={mockAnalytics.overview.avgOrderValue.change}
                trend={mockAnalytics.overview.avgOrderValue.trend}
                icon={ShoppingCartIcon}
                format="currency"
              />
              <StatCard
                title="Total Orders"
                value={mockAnalytics.overview.totalOrders.value}
                change={mockAnalytics.overview.totalOrders.change}
                trend={mockAnalytics.overview.totalOrders.trend}
                icon={ChartBarIcon}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
              <div className="h-96">
                <Bar 
                  data={mockAnalytics.revenueData} 
                  options={{
                    ...chartOptions,
                    scales: {
                      x: { stacked: true },
                      y: { stacked: true, beginAtZero: true }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
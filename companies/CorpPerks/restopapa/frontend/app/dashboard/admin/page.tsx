'use client'

import { useState } from 'react'
import { 
  ChartBarIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  CogIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const navigationItems = [
  { name: 'Overview', icon: ChartBarIcon, id: 'overview' },
  { name: 'User Management', icon: UsersIcon, id: 'users' },
  { name: 'Restaurant Verification', icon: BuildingStorefrontIcon, id: 'restaurants' },
  { name: 'System Monitoring', icon: CogIcon, id: 'monitoring' },
  { name: 'Security Reports', icon: ShieldCheckIcon, id: 'security' },
  { name: 'Platform Settings', icon: CogIcon, id: 'settings' },
]

const systemStats = [
  { label: 'Total Users', value: '12,847', change: '+8.2%', trend: 'up' },
  { label: 'Active Restaurants', value: '1,247', change: '+12.1%', trend: 'up' },
  { label: 'Pending Verifications', value: '23', change: '-15.3%', trend: 'down' },
  { label: 'Security Alerts', value: '3', change: '+2', trend: 'up' },
]

const recentActivity = [
  { type: 'verification', message: 'Restaurant "Spice Garden" verified successfully', time: '2 min ago', status: 'success' },
  { type: 'alert', message: 'Suspicious activity detected from IP 192.168.1.1', time: '15 min ago', status: 'warning' },
  { type: 'user', message: 'New restaurant registration: "Ocean View Diner"', time: '1 hour ago', status: 'info' },
  { type: 'fraud', message: 'Fraud report submitted against employee ID #12345', time: '2 hours ago', status: 'danger' },
]

const pendingVerifications = [
  { name: 'Tasty Corner', type: 'Restaurant', location: 'Mumbai', submitted: '2 days ago', documents: 4 },
  { name: 'Food Paradise', type: 'Restaurant', location: 'Delhi', submitted: '1 day ago', documents: 3 },
  { name: 'John Smith', type: 'Employee', location: 'Bangalore', submitted: '3 hours ago', documents: 2 },
]

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemStats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 py-2">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' :
                  activity.status === 'danger' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Review Verifications</p>
                  <p className="text-sm text-gray-500">23 pending approvals</p>
                </div>
              </div>
            </button>
            <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Security Alerts</p>
                  <p className="text-sm text-gray-500">3 active alerts</p>
                </div>
              </div>
            </button>
            <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <UsersIcon className="w-5 h-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">User Management</p>
                  <p className="text-sm text-gray-500">Manage platform users</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">User Management</h2>
        <div className="flex space-x-3">
          <select className="px-3 py-2 border border-gray-300 rounded-lg">
            <option>All Users</option>
            <option>Restaurants</option>
            <option>Employees</option>
            <option>Admins</option>
          </select>
          <button className="btn-primary">Export Data</button>
        </div>
      </div>
      
      <div className="card overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">John Doe</div>
                    <div className="text-sm text-gray-500">restaurant@example.com</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Restaurant</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jan 15, 2024</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button className="text-primary-600 hover:text-primary-900">View</button>
                <button className="text-red-600 hover:text-red-900">Suspend</button>
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Jane Smith</div>
                    <div className="text-sm text-gray-500">employee@example.com</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Employee</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Feb 3, 2024</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button className="text-primary-600 hover:text-primary-900">View</button>
                <button className="text-red-600 hover:text-red-900">Suspend</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderRestaurants = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Restaurant Verification</h2>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">23 pending verifications</span>
          <button className="btn-primary">Bulk Actions</button>
        </div>
      </div>
      
      <div className="space-y-4">
        {pendingVerifications.map((item, index) => (
          <div key={index} className="card border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                  <span className="ml-3 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Pending Verification
                  </span>
                </div>
                <div className="text-sm text-gray-500 space-x-4">
                  <span>📍 {item.location}</span>
                  <span>📄 {item.documents} documents</span>
                  <span>⏰ Submitted {item.submitted}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="btn border border-gray-300 text-gray-700 hover:bg-gray-50">
                  Review Documents
                </button>
                <button className="btn bg-green-600 text-white hover:bg-green-700">
                  Approve
                </button>
                <button className="btn bg-red-600 text-white hover:bg-red-700">
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSecurity = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Security Reports & Monitoring</h2>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Critical Alerts</h3>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">Suspicious Login Activity</p>
              <p className="text-xs text-red-600">Multiple failed attempts from 192.168.1.1</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">Fraud Report</p>
              <p className="text-xs text-red-600">Employee background verification failed</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-yellow-600">Warnings</h3>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">High Login Volume</p>
              <p className="text-xs text-yellow-600">Unusual activity detected in last hour</p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">Document Anomaly</p>
              <p className="text-xs text-yellow-600">Potential duplicate documents detected</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-green-600">System Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Database</span>
              <span className="text-green-600 font-semibold">Healthy</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">API Gateway</span>
              <span className="text-green-600 font-semibold">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Verification Service</span>
              <span className="text-green-600 font-semibold">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverview()
      case 'users': return renderUsers()
      case 'restaurants': return renderRestaurants()
      case 'security': return renderSecurity()
      default: return renderOverview()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} lg:w-64`}>
        <div className="p-4">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-purple-600">🛡️</span>
            <span className={`ml-2 text-xl font-bold text-purple-600 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
              Admin Panel
            </span>
          </div>
        </div>
        
        <nav className="mt-8">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                  activeSection === item.id 
                    ? 'bg-purple-50 text-purple-600 border-r-2 border-purple-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className={`ml-3 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
                  {item.name}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                {sidebarOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
              </button>
              <h1 className="ml-4 text-2xl font-semibold text-gray-900 capitalize">
                Admin {activeSection}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Logged in as Admin
              </div>
              <button className="p-2 rounded-md text-gray-600 hover:bg-gray-100 relative">
                <BellIcon className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
                <UserCircleIcon className="w-8 h-8" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
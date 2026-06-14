'use client'

import { useState } from 'react'
import { 
  HomeIcon, 
  BuildingStorefrontIcon, 
  UsersIcon, 
  BriefcaseIcon, 
  ShoppingCartIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'

const navigationItems = [
  { name: 'Dashboard', icon: HomeIcon, id: 'dashboard' },
  { name: 'Restaurants', icon: BuildingStorefrontIcon, id: 'restaurants' },
  { name: 'Employees', icon: UsersIcon, id: 'employees' },
  { name: 'Jobs', icon: BriefcaseIcon, id: 'jobs' },
  { name: 'Vendors', icon: ShoppingCartIcon, id: 'vendors' },
  { name: 'Community', icon: ChatBubbleLeftRightIcon, id: 'community' },
  { name: 'Security', icon: ShieldCheckIcon, id: 'security' },
]

const restaurantData = [
  { name: 'Tasty Bites', location: 'Mumbai', status: 'Verified', employees: 25 },
  { name: 'Spice Garden', location: 'Delhi', status: 'Pending', employees: 18 },
  { name: 'Ocean Grill', location: 'Bangalore', status: 'Verified', employees: 32 },
]

const jobData = [
  { title: 'Senior Chef', restaurant: 'Tasty Bites', location: 'Mumbai', salary: '₹25k-35k', applicants: 12 },
  { title: 'Waiter/Waitress', restaurant: 'Spice Garden', location: 'Delhi', salary: '₹18k-25k', applicants: 8 },
  { title: 'Kitchen Manager', restaurant: 'Ocean Grill', location: 'Bangalore', salary: '₹30k-45k', applicants: 6 },
]

const employeeData = [
  { name: 'Jane Smith', position: 'Senior Chef', restaurant: 'Tasty Bites', rating: 4.8, experience: '3 years' },
  { name: 'Raj Kumar', position: 'Waiter', restaurant: 'Spice Garden', rating: 4.5, experience: '2 years' },
  { name: 'Priya Sharma', position: 'Manager', restaurant: 'Ocean Grill', rating: 4.9, experience: '5 years' },
]

const vendorData = [
  { name: 'Fresh Farm Supplies', category: 'Raw Materials', rating: 4.7, orders: 156 },
  { name: 'Kitchen Equipment Pro', category: 'Equipment', rating: 4.5, orders: 89 },
  { name: 'Packaging Solutions', category: 'Packaging', rating: 4.6, orders: 203 },
]

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="text-3xl font-bold">1,247</div>
          <div className="text-blue-100">Total Restaurants</div>
        </div>
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="text-3xl font-bold">8,932</div>
          <div className="text-green-100">Active Employees</div>
        </div>
        <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="text-3xl font-bold">532</div>
          <div className="text-purple-100">Open Jobs</div>
        </div>
        <div className="card bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="text-3xl font-bold">1,845</div>
          <div className="text-orange-100">Trusted Vendors</div>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium">New restaurant registered</p>
                <p className="text-xs text-gray-500">Tasty Bites - Mumbai</p>
              </div>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium">Job application received</p>
                <p className="text-xs text-gray-500">Senior Chef position</p>
              </div>
              <span className="text-xs text-gray-400">4 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Employee verified</p>
                <p className="text-xs text-gray-500">Jane Smith - Aadhaar verified</p>
              </div>
              <span className="text-xs text-gray-400">1 day ago</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-2">🏪</div>
              <div className="text-sm font-medium">Add Restaurant</div>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-2">💼</div>
              <div className="text-sm font-medium">Post Job</div>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium">Verify Employee</div>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-2">🛒</div>
              <div className="text-sm font-medium">Find Vendors</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderRestaurants = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Restaurant Management</h2>
        <button className="btn-primary">Add New Restaurant</button>
      </div>
      
      <div className="card overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {restaurantData.map((restaurant, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{restaurant.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{restaurant.location}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    restaurant.status === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {restaurant.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{restaurant.employees}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-900 mr-4">View</button>
                  <button className="text-gray-600 hover:text-gray-900">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderEmployees = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Employee Directory</h2>
        <button className="btn-primary">Verify New Employee</button>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {employeeData.map((employee, index) => (
          <div key={index} className="card">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <UserCircleIcon className="w-8 h-8 text-gray-600" />
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">{employee.name}</h3>
                <p className="text-sm text-gray-500">{employee.position}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Restaurant:</span>
                <span>{employee.restaurant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rating:</span>
                <span className="text-yellow-600">⭐ {employee.rating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Experience:</span>
                <span>{employee.experience}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full btn-primary">View Profile</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderJobs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Job Management</h2>
        <button className="btn-primary">Post New Job</button>
      </div>
      
      <div className="space-y-4">
        {jobData.map((job, index) => (
          <div key={index} className="card border-l-4 border-primary-500">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{job.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <span>🏪 {job.restaurant}</span>
                  <span>📍 {job.location}</span>
                  <span>💰 {job.salary}</span>
                </div>
                <div className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {job.applicants} applicants
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="btn border border-gray-300 text-gray-700 hover:bg-gray-50">View Applications</button>
                <button className="btn-primary">Edit Job</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderVendors = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Vendor Marketplace</h2>
        <button className="btn-primary">Add Vendor</button>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {vendorData.map((vendor, index) => (
          <div key={index} className="card">
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-1">{vendor.name}</h3>
              <p className="text-sm text-gray-500">{vendor.category}</p>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Rating:</span>
                <span className="text-yellow-600">⭐ {vendor.rating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Orders:</span>
                <span>{vendor.orders}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="flex-1 btn border border-gray-300 text-gray-700 hover:bg-gray-50">View Products</button>
              <button className="flex-1 btn-primary">Contact</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCommunity = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Community Forum</h2>
        <button className="btn-primary">Create Discussion</button>
      </div>
      
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
              R
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-gray-900">Looking for Reliable Delivery Partners</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Vendor Inquiry</span>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                We are expanding our delivery service and need reliable delivery partners. Any recommendations for good delivery service providers in Mumbai?
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>👍 5 likes</span>
                <span>💬 3 comments</span>
                <span>⏰ 2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
              V
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-gray-900">New Year Special: 20% Off on All Fresh Produce</h3>
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">Business Offer</span>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Celebrating New Year with special discounts! Get 20% off on all fresh vegetables and fruits. Contact us for bulk orders.
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>👍 12 likes</span>
                <span>💬 7 comments</span>
                <span>⏰ 5 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSecurity = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Security & Fraud Prevention</h2>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ShieldCheckIcon className="w-5 h-5 mr-2 text-green-500" />
            Security Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Employee Verifications</span>
              <span className="text-green-600 font-semibold">98.5% Complete</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Fraud Reports</span>
              <span className="text-yellow-600 font-semibold">3 Pending</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">System Security</span>
              <span className="text-green-600 font-semibold">Secure</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">Suspicious Activity Detected</p>
              <p className="text-xs text-yellow-600">Multiple login attempts from unknown location</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">Fraud Report Submitted</p>
              <p className="text-xs text-red-600">Employee background check failed</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">Verification Complete</p>
              <p className="text-xs text-green-600">Restaurant profile successfully verified</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard()
      case 'restaurants': return renderRestaurants()
      case 'employees': return renderEmployees()
      case 'jobs': return renderJobs()
      case 'vendors': return renderVendors()
      case 'community': return renderCommunity()
      case 'security': return renderSecurity()
      default: return renderDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} lg:w-64`}>
        <div className="p-4">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-primary-600">RH</span>
            <span className={`ml-2 text-xl font-bold text-primary-600 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
              RestaurantHub
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
                    ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' 
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
                {activeSection}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
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
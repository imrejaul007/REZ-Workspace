'use client'

import { useState } from 'react'
import { 
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  StarIcon,
  ShoppingBagIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  location: string
  avatar?: string
  joinDate: string
  totalOrders: number
  totalSpent: number
  avgOrderValue: number
  lastOrder: string
  status: 'active' | 'inactive' | 'vip'
  rating: number
  notes?: string
  preferredProducts: string[]
}

interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  vipCustomers: number
  newThisMonth: number
  avgOrderValue: number
  customerRetention: number
}

export default function VendorCustomers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const stats: CustomerStats = {
    totalCustomers: 145,
    activeCustomers: 89,
    vipCustomers: 12,
    newThisMonth: 23,
    avgOrderValue: 157.69,
    customerRetention: 68.5
  }

  const customers: Customer[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1 (555) 123-4567',
      location: 'Downtown Kitchen, New York',
      joinDate: '2024-01-15',
      totalOrders: 24,
      totalSpent: 3240.50,
      avgOrderValue: 135.02,
      lastOrder: '2024-01-20',
      status: 'vip',
      rating: 4.8,
      preferredProducts: ['Organic Tomatoes', 'Fresh Basil', 'Bell Peppers'],
      notes: 'Prefers organic products, orders weekly on Mondays'
    },
    {
      id: '2',
      name: 'Marco Rodriguez',
      email: 'marco.r@bistro.com',
      phone: '+1 (555) 234-5678',
      location: 'Marco\'s Bistro, Los Angeles',
      joinDate: '2023-11-08',
      totalOrders: 18,
      totalSpent: 2890.75,
      avgOrderValue: 160.60,
      lastOrder: '2024-01-18',
      status: 'active',
      rating: 4.6,
      preferredProducts: ['Mushroom Mix', 'Lettuce Hearts'],
      notes: 'Always orders in bulk, very punctual with payments'
    },
    {
      id: '3',
      name: 'Lisa Chen',
      email: 'lisa.chen@restaurant.com',
      phone: '+1 (555) 345-6789',
      location: 'Golden Dragon, San Francisco',
      joinDate: '2024-01-10',
      totalOrders: 12,
      totalSpent: 1680.25,
      avgOrderValue: 140.02,
      lastOrder: '2024-01-19',
      status: 'active',
      rating: 4.4,
      preferredProducts: ['Bell Peppers', 'Mushroom Mix'],
      notes: 'New customer, shows great potential'
    },
    {
      id: '4',
      name: 'David Thompson',
      email: 'david.t@steakhouse.com',
      phone: '+1 (555) 456-7890',
      location: 'Prime Cuts Steakhouse, Chicago',
      joinDate: '2023-08-22',
      totalOrders: 31,
      totalSpent: 4520.80,
      avgOrderValue: 145.83,
      lastOrder: '2024-01-15',
      status: 'vip',
      rating: 4.9,
      preferredProducts: ['Mushroom Mix', 'Organic Tomatoes'],
      notes: 'High-volume customer, prefers premium quality'
    },
    {
      id: '5',
      name: 'Amanda Wilson',
      email: 'amanda.w@cafe.com',
      phone: '+1 (555) 567-8901',
      location: 'Sunny Side Cafe, Miami',
      joinDate: '2023-12-03',
      totalOrders: 8,
      totalSpent: 920.40,
      avgOrderValue: 115.05,
      lastOrder: '2023-12-28',
      status: 'inactive',
      rating: 4.2,
      preferredProducts: ['Lettuce Hearts', 'Fresh Basil'],
      notes: 'Has not ordered recently, may need follow-up'
    }
  ]

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-purple-100 text-purple-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vip': return <StarIcon className="w-3 h-3" />
      case 'active': return <UserGroupIcon className="w-3 h-3" />
      case 'inactive': return <ExclamationTriangleIcon className="w-3 h-3" />
      default: return <UserGroupIcon className="w-3 h-3" />
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600">Manage relationships and track customer insights</p>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <UserGroupIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <StarIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">VIP</p>
              <p className="text-2xl font-bold text-gray-900">{stats.vipCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <CalendarIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">New</p>
              <p className="text-2xl font-bold text-gray-900">{stats.newThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg mr-3">
              <CurrencyDollarIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order</p>
              <p className="text-2xl font-bold text-gray-900">${stats.avgOrderValue}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-pink-100 rounded-lg mr-3">
              <UserGroupIcon className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Retention</p>
              <p className="text-2xl font-bold text-gray-900">{stats.customerRetention}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="vip">VIP Customers</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Customers ({filteredCustomers.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        {customer.avatar ? (
                          <img src={customer.avatar} alt={customer.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <UserGroupIcon className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.totalOrders}</div>
                    <div className="text-sm text-gray-500">${customer.avgOrderValue.toFixed(2)} avg</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">${customer.totalSpent.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.lastOrder}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                      {getStatusIcon(customer.status)}
                      <span className="ml-1 capitalize">{customer.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900">{customer.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <EnvelopeIcon className="w-4 h-4" />
                      </button>
                      <button className="text-purple-600 hover:text-purple-900">
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                    {selectedCustomer.avatar ? (
                      <img src={selectedCustomer.avatar} alt={selectedCustomer.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <UserGroupIcon className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h3>
                    <p className="text-gray-600">{selectedCustomer.location}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedCustomer.location}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-900">Joined {selectedCustomer.joinDate}</span>
                  </div>
                </div>
              </div>

              {/* Order Statistics */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Order Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{selectedCustomer.totalOrders}</p>
                    <p className="text-sm text-gray-600">Total Orders</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">${selectedCustomer.totalSpent.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Spent</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">${selectedCustomer.avgOrderValue.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                  </div>
                </div>
              </div>

              {/* Preferred Products */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Preferred Products</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.preferredProducts.map((product, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedCustomer.notes && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Notes</h4>
                  <p className="text-sm text-gray-700 bg-yellow-50 p-4 rounded-lg">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
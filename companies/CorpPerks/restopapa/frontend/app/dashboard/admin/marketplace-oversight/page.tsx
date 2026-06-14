'use client'

import { useState } from 'react'
import {
  BuildingStorefrontIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  StarIcon,
  TrophyIcon,
  BanknotesIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  PhotoIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline'

interface Vendor {
  id: string
  businessName: string
  ownerName: string
  email: string
  phone: string
  category: string
  location: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  verificationStatus: 'pending' | 'verified' | 'rejected'
  registrationDate: string
  lastActive: string
  totalProducts: number
  totalOrders: number
  revenue: number
  rating: number
  trustScore: number
  documents: {
    businessLicense: boolean
    gstCertificate: boolean
    bankDetails: boolean
    productCatalog: boolean
  }
}

interface Product {
  id: string
  name: string
  vendor: string
  vendorId: string
  category: string
  price: number
  unit: string
  description: string
  images: string[]
  status: 'active' | 'inactive' | 'under_review' | 'rejected'
  isFeatured: boolean
  stockQuantity: number
  orders: number
  revenue: number
  rating: number
  createdAt: string
  lastUpdated: string
  moderationFlags: string[]
}

interface Order {
  id: string
  orderNumber: string
  vendor: string
  customer: string
  items: {
    productId: string
    productName: string
    quantity: number
    price: number
  }[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'disputed'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  orderDate: string
  deliveryDate?: string
  commission: number
  disputes?: {
    reason: string
    status: string
    reportedBy: string
    reportedAt: string
  }[]
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  parentId?: string
  isActive: boolean
  productCount: number
  commission: number
  featured: boolean
}

const mockVendors: Vendor[] = [
  {
    id: 'VND-001',
    businessName: 'Fresh Farm Supplies',
    ownerName: 'Rajesh Kumar',
    email: 'rajesh@freshfarm.com',
    phone: '+91 98765 43210',
    category: 'Raw Materials',
    location: 'Mumbai, Maharashtra',
    status: 'pending',
    verificationStatus: 'pending',
    registrationDate: '2025-01-10T09:00:00Z',
    lastActive: '2025-01-15T14:30:00Z',
    totalProducts: 45,
    totalOrders: 0,
    revenue: 0,
    rating: 0,
    trustScore: 65,
    documents: {
      businessLicense: true,
      gstCertificate: true,
      bankDetails: true,
      productCatalog: false
    }
  },
  {
    id: 'VND-002',
    businessName: 'Kitchen Equipment Pro',
    ownerName: 'Sarah Johnson',
    email: 'sarah@kitchenpro.com',
    phone: '+91 87654 32109',
    category: 'Equipment',
    location: 'Delhi, NCR',
    status: 'approved',
    verificationStatus: 'verified',
    registrationDate: '2024-12-15T10:00:00Z',
    lastActive: '2025-01-15T16:45:00Z',
    totalProducts: 123,
    totalOrders: 89,
    revenue: 245000,
    rating: 4.7,
    trustScore: 92,
    documents: {
      businessLicense: true,
      gstCertificate: true,
      bankDetails: true,
      productCatalog: true
    }
  },
  {
    id: 'VND-003',
    businessName: 'Spice World Wholesale',
    ownerName: 'Amit Patel',
    email: 'amit@spiceworld.com',
    phone: '+91 76543 21098',
    category: 'Raw Materials',
    location: 'Ahmedabad, Gujarat',
    status: 'approved',
    verificationStatus: 'verified',
    registrationDate: '2024-11-20T11:30:00Z',
    lastActive: '2025-01-15T12:20:00Z',
    totalProducts: 234,
    totalOrders: 156,
    revenue: 456000,
    rating: 4.5,
    trustScore: 88,
    documents: {
      businessLicense: true,
      gstCertificate: true,
      bankDetails: true,
      productCatalog: true
    }
  }
]

const mockProducts: Product[] = [
  {
    id: 'PRD-001',
    name: 'Premium Basmati Rice - 25kg',
    vendor: 'Fresh Farm Supplies',
    vendorId: 'VND-001',
    category: 'Raw Materials',
    price: 2500,
    unit: '25kg bag',
    description: 'High quality basmati rice sourced directly from Punjab farms',
    images: ['/images/basmati-rice.jpg'],
    status: 'under_review',
    isFeatured: false,
    stockQuantity: 100,
    orders: 0,
    revenue: 0,
    rating: 0,
    createdAt: '2025-01-12T10:00:00Z',
    lastUpdated: '2025-01-12T10:00:00Z',
    moderationFlags: ['new_product']
  },
  {
    id: 'PRD-002',
    name: 'Commercial Gas Stove - 4 Burner',
    vendor: 'Kitchen Equipment Pro',
    vendorId: 'VND-002',
    category: 'Equipment',
    price: 15000,
    unit: 'piece',
    description: 'Heavy duty 4-burner gas stove for commercial kitchen use',
    images: ['/images/gas-stove.jpg'],
    status: 'active',
    isFeatured: true,
    stockQuantity: 25,
    orders: 12,
    revenue: 180000,
    rating: 4.8,
    createdAt: '2024-12-20T14:30:00Z',
    lastUpdated: '2025-01-10T11:45:00Z',
    moderationFlags: []
  }
]

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    orderNumber: 'MKT-2025-001',
    vendor: 'Kitchen Equipment Pro',
    customer: 'Spice Garden Restaurant',
    items: [
      {
        productId: 'PRD-002',
        productName: 'Commercial Gas Stove - 4 Burner',
        quantity: 2,
        price: 15000
      }
    ],
    totalAmount: 30000,
    status: 'delivered',
    paymentStatus: 'paid',
    orderDate: '2025-01-10T10:00:00Z',
    deliveryDate: '2025-01-12T15:30:00Z',
    commission: 3000
  },
  {
    id: 'ORD-002',
    orderNumber: 'MKT-2025-002',
    vendor: 'Spice World Wholesale',
    customer: 'Mumbai Tadka House',
    items: [
      {
        productId: 'PRD-003',
        productName: 'Mixed Spices Combo Pack',
        quantity: 5,
        price: 1200
      }
    ],
    totalAmount: 6000,
    status: 'disputed',
    paymentStatus: 'paid',
    orderDate: '2025-01-12T14:00:00Z',
    commission: 600,
    disputes: [
      {
        reason: 'Quality issue with spices',
        status: 'under_review',
        reportedBy: 'customer',
        reportedAt: '2025-01-14T16:30:00Z'
      }
    ]
  }
]

const mockCategories: Category[] = [
  {
    id: 'CAT-001',
    name: 'Raw Materials',
    slug: 'raw-materials',
    description: 'Fresh produce, spices, and cooking ingredients',
    icon: '🥬',
    isActive: true,
    productCount: 456,
    commission: 8,
    featured: true
  },
  {
    id: 'CAT-002',
    name: 'Kitchen Equipment',
    slug: 'kitchen-equipment',
    description: 'Commercial kitchen appliances and equipment',
    icon: '🍳',
    isActive: true,
    productCount: 234,
    commission: 12,
    featured: true
  },
  {
    id: 'CAT-003',
    name: 'Packaging Supplies',
    slug: 'packaging-supplies',
    description: 'Food packaging, containers, and disposables',
    icon: '📦',
    isActive: true,
    productCount: 123,
    commission: 10,
    featured: false
  }
]

export default function MarketplaceOversight() {
  const [activeTab, setActiveTab] = useState('vendors')
  const [vendors, setVendors] = useState(mockVendors)
  const [products, setProducts] = useState(mockProducts)
  const [orders, setOrders] = useState(mockOrders)
  const [categories, setCategories] = useState(mockCategories)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': case 'verified': case 'active': case 'delivered': case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending': case 'under_review': case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected': case 'suspended': case 'cancelled': case 'failed':
        return 'bg-red-100 text-red-800'
      case 'inactive': case 'disputed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleVendorAction = (vendorId: string, action: 'approve' | 'reject' | 'suspend') => {
    setVendors(prev => prev.map(vendor => {
      if (vendor.id === vendorId) {
        let newStatus = vendor.status
        let newVerificationStatus = vendor.verificationStatus
        
        switch (action) {
          case 'approve':
            newStatus = 'approved'
            newVerificationStatus = 'verified'
            break
          case 'reject':
            newStatus = 'rejected'
            newVerificationStatus = 'rejected'
            break
          case 'suspend':
            newStatus = 'suspended'
            break
        }
        
        return { ...vendor, status: newStatus, verificationStatus: newVerificationStatus }
      }
      return vendor
    }))
  }

  const handleProductAction = (productId: string, action: 'approve' | 'reject' | 'feature' | 'unfeature') => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        switch (action) {
          case 'approve':
            return { ...product, status: 'active' }
          case 'reject':
            return { ...product, status: 'rejected' }
          case 'feature':
            return { ...product, isFeatured: true }
          case 'unfeature':
            return { ...product, isFeatured: false }
          default:
            return product
        }
      }
      return product
    }))
  }

  const handleOrderDispute = (orderId: string, action: 'resolve' | 'investigate') => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId && order.disputes) {
        const updatedDisputes = order.disputes.map(dispute => ({
          ...dispute,
          status: action === 'resolve' ? 'resolved' : 'investigating'
        }))
        return {
          ...order,
          disputes: updatedDisputes,
          status: action === 'resolve' ? 'delivered' : order.status
        }
      }
      return order
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketplace Oversight</h1>
            <p className="text-gray-600 mt-2">Monitor vendors, products, orders, and marketplace performance</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
              Export Data
            </button>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <PlusIcon className="w-5 h-5" />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
                <p className="text-sm text-green-600">
                  {vendors.filter(v => v.status === 'approved').length} approved
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TagIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <p className="text-sm text-yellow-600">
                  {products.filter(p => p.status === 'under_review').length} pending review
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingCartIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                <p className="text-sm text-red-600">
                  {orders.filter(o => o.status === 'disputed').length} disputes
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CurrencyRupeeIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(vendors.reduce((sum, v) => sum + v.revenue, 0))}
                </p>
                <p className="text-sm text-green-600">+15.3% this month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'vendors', name: 'Vendors', icon: UserGroupIcon },
              { id: 'products', name: 'Products', icon: TagIcon },
              { id: 'orders', name: 'Orders', icon: ShoppingCartIcon },
              { id: 'categories', name: 'Categories', icon: FunnelIcon },
              { id: 'analytics', name: 'Analytics', icon: ChartBarIcon }
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

        {/* Vendors Tab */}
        {activeTab === 'vendors' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search vendors..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trust Score</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="all">All Scores</option>
                    <option value="high">High (80+)</option>
                    <option value="medium">Medium (60-79)</option>
                    <option value="low">Low (Below 60)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vendors Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trust Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <BuildingStorefrontIcon className="w-6 h-6 text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{vendor.businessName}</div>
                              <div className="text-sm text-gray-500">{vendor.ownerName}</div>
                              <div className="text-sm text-gray-500">{vendor.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vendor.category}</div>
                          <div className="text-sm text-gray-500">{vendor.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vendor.status)}`}>
                              {vendor.status}
                            </span>
                            <div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vendor.verificationStatus)}`}>
                                {vendor.verificationStatus}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>Products: {vendor.totalProducts}</div>
                          <div>Orders: {vendor.totalOrders}</div>
                          <div>Revenue: {formatCurrency(vendor.revenue)}</div>
                          {vendor.rating > 0 && (
                            <div className="flex items-center">
                              <StarIcon className="w-4 h-4 text-yellow-400" />
                              <span className="ml-1">{vendor.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{vendor.trustScore}/100</div>
                            <div className="ml-3 w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  vendor.trustScore >= 80 ? 'bg-green-500' :
                                  vendor.trustScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${vendor.trustScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button className="text-blue-600 hover:text-blue-900">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {vendor.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleVendorAction(vendor.id, 'approve')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Approve Vendor"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleVendorAction(vendor.id, 'reject')}
                                  className="text-red-600 hover:text-red-900"
                                  title="Reject Vendor"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {vendor.status === 'approved' && (
                              <button
                                onClick={() => handleVendorAction(vendor.id, 'suspend')}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Suspend Vendor"
                              >
                                <ExclamationTriangleIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                              <PhotoIcon className="w-6 h-6 text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.category}</div>
                              {product.isFeatured && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                  <TrophyIcon className="w-3 h-3 mr-1" />
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.vendor}</div>
                          <div className="text-sm text-gray-500">{product.vendorId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(product.price)}</div>
                          <div className="text-sm text-gray-500">per {product.unit}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(product.status)}`}>
                            {product.status.replace('_', ' ')}
                          </span>
                          {product.moderationFlags.length > 0 && (
                            <div className="mt-1">
                              {product.moderationFlags.map((flag, index) => (
                                <span key={index} className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded mr-1">
                                  {flag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>Stock: {product.stockQuantity}</div>
                          <div>Orders: {product.orders}</div>
                          <div>Revenue: {formatCurrency(product.revenue)}</div>
                          {product.rating > 0 && (
                            <div className="flex items-center">
                              <StarIcon className="w-4 h-4 text-yellow-400" />
                              <span className="ml-1">{product.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button className="text-blue-600 hover:text-blue-900">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {product.status === 'under_review' && (
                              <>
                                <button
                                  onClick={() => handleProductAction(product.id, 'approve')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Approve Product"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleProductAction(product.id, 'reject')}
                                  className="text-red-600 hover:text-red-900"
                                  title="Reject Product"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {product.status === 'active' && (
                              <button
                                onClick={() => handleProductAction(product.id, product.isFeatured ? 'unfeature' : 'feature')}
                                className="text-yellow-600 hover:text-yellow-900"
                                title={product.isFeatured ? 'Remove from Featured' : 'Make Featured'}
                              >
                                <TrophyIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Marketplace Categories</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Add Category
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{category.icon}</div>
                        <div>
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                          <p className="text-sm text-gray-500">{category.productCount} products</p>
                        </div>
                      </div>
                      {category.featured && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          <TrophyIcon className="w-3 h-3 mr-1" />
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Commission:</span>
                      <span className="font-medium">{category.commission}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Edit Category
                      </button>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-600 hover:text-gray-800">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Vendors</h3>
                <div className="space-y-4">
                  {vendors
                    .filter(v => v.revenue > 0)
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5)
                    .map((vendor, index) => (
                      <div key={vendor.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                            <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{vendor.businessName}</p>
                            <p className="text-sm text-gray-500">{vendor.totalOrders} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(vendor.revenue)}</p>
                          <p className="text-sm text-gray-500">⭐ {vendor.rating.toFixed(1)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{category.icon}</span>
                          <span className="font-medium text-gray-900">{category.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{category.productCount} products</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Commission Rate:</span>
                        <span className="font-medium">{category.commission}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
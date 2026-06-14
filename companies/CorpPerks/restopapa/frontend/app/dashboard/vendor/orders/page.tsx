'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TruckIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface OrderItem {
  id: number
  productId: number
  productName: string
  sku: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
}

interface Order {
  id: number
  orderNumber: string
  customer: {
    name: string
    type: 'restaurant' | 'individual'
    contact: {
      email: string
      phone: string
      address: {
        street: string
        city: string
        state: string
        zip: string
      }
    }
    businessInfo?: {
      businessName: string
      taxId: string
    }
  }
  items: OrderItem[]
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled'
  orderDate: string
  requestedDeliveryDate: string
  estimatedDeliveryDate?: string
  actualDeliveryDate?: string
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: 'credit_card' | 'ach' | 'terms'
  shippingMethod: 'pickup' | 'delivery' | 'freight'
  notes?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tracking?: string
}

const mockOrders: Order[] = [
  {
    id: 1,
    orderNumber: 'ORD-2024-001',
    customer: {
      name: 'John Smith',
      type: 'restaurant',
      contact: {
        email: 'john@oceanviewrestaurant.com',
        phone: '+1 (305) 555-0123',
        address: {
          street: '123 Ocean Drive',
          city: 'Miami Beach',
          state: 'FL',
          zip: '33139'
        }
      },
      businessInfo: {
        businessName: 'Ocean View Restaurant',
        taxId: '12-3456789'
      }
    },
    items: [
      {
        id: 1,
        productId: 1,
        productName: 'Organic Roma Tomatoes',
        sku: 'ORG-TOM-001',
        quantity: 25,
        unit: 'lb',
        unitPrice: 4.99,
        totalPrice: 124.75
      },
      {
        id: 2,
        productId: 2,
        productName: 'Premium Aged Parmesan',
        sku: 'PARM-001',
        quantity: 5,
        unit: 'lb',
        unitPrice: 28.99,
        totalPrice: 144.95
      }
    ],
    status: 'confirmed',
    orderDate: '2024-03-20T10:30:00Z',
    requestedDeliveryDate: '2024-03-25',
    estimatedDeliveryDate: '2024-03-25',
    totalAmount: 269.70,
    paymentStatus: 'paid',
    paymentMethod: 'terms',
    shippingMethod: 'delivery',
    notes: 'Please deliver between 8-10 AM. Use back entrance.',
    priority: 'high'
  },
  {
    id: 2,
    orderNumber: 'ORD-2024-002',
    customer: {
      name: 'Maria Garcia',
      type: 'restaurant',
      contact: {
        email: 'maria@bellaitalia.com',
        phone: '+1 (305) 555-0456',
        address: {
          street: '456 Lincoln Road',
          city: 'Miami',
          state: 'FL',
          zip: '33139'
        }
      },
      businessInfo: {
        businessName: 'Bella Italia Ristorante',
        taxId: '98-7654321'
      }
    },
    items: [
      {
        id: 3,
        productId: 3,
        productName: 'Wild Caught Atlantic Salmon',
        sku: 'SALM-WC-001',
        quantity: 10,
        unit: 'lb',
        unitPrice: 24.99,
        totalPrice: 249.90
      }
    ],
    status: 'preparing',
    orderDate: '2024-03-21T14:15:00Z',
    requestedDeliveryDate: '2024-03-24',
    estimatedDeliveryDate: '2024-03-24',
    totalAmount: 249.90,
    paymentStatus: 'paid',
    paymentMethod: 'credit_card',
    shippingMethod: 'pickup',
    priority: 'medium'
  },
  {
    id: 3,
    orderNumber: 'ORD-2024-003',
    customer: {
      name: 'David Chen',
      type: 'restaurant',
      contact: {
        email: 'david@steakhouseprime.com',
        phone: '+1 (305) 555-0789',
        address: {
          street: '789 Biscayne Blvd',
          city: 'Miami',
          state: 'FL',
          zip: '33132'
        }
      },
      businessInfo: {
        businessName: 'Steakhouse Prime',
        taxId: '55-1234567'
      }
    },
    items: [
      {
        id: 4,
        productId: 5,
        productName: 'Grass-Fed Beef Tenderloin',
        sku: 'BEEF-TEND-001',
        quantity: 20,
        unit: 'lb',
        unitPrice: 39.99,
        totalPrice: 799.80
      },
      {
        id: 5,
        productId: 4,
        productName: 'Truffle Oil',
        sku: 'TRUF-OIL-001',
        quantity: 6,
        unit: '250ml bottle',
        unitPrice: 45.99,
        totalPrice: 275.94
      }
    ],
    status: 'pending',
    orderDate: '2024-03-22T09:45:00Z',
    requestedDeliveryDate: '2024-03-28',
    totalAmount: 1075.74,
    paymentStatus: 'pending',
    paymentMethod: 'terms',
    shippingMethod: 'delivery',
    notes: 'High-priority order for weekend special menu.',
    priority: 'urgent'
  },
  {
    id: 4,
    orderNumber: 'ORD-2024-004',
    customer: {
      name: 'Sarah Wilson',
      type: 'restaurant',
      contact: {
        email: 'sarah@freshbistro.com',
        phone: '+1 (305) 555-0321',
        address: {
          street: '321 Collins Ave',
          city: 'Miami Beach',
          state: 'FL',
          zip: '33154'
        }
      },
      businessInfo: {
        businessName: 'Fresh Garden Bistro',
        taxId: '77-9876543'
      }
    },
    items: [
      {
        id: 6,
        productId: 1,
        productName: 'Organic Roma Tomatoes',
        sku: 'ORG-TOM-001',
        quantity: 15,
        unit: 'lb',
        unitPrice: 4.99,
        totalPrice: 74.85
      }
    ],
    status: 'delivered',
    orderDate: '2024-03-18T11:20:00Z',
    requestedDeliveryDate: '2024-03-20',
    estimatedDeliveryDate: '2024-03-20',
    actualDeliveryDate: '2024-03-20T08:30:00Z',
    totalAmount: 74.85,
    paymentStatus: 'paid',
    paymentMethod: 'credit_card',
    shippingMethod: 'delivery',
    priority: 'low',
    tracking: 'TRK123456789'
  }
]

export default function VendorOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customer.businessInfo?.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ready': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />
      case 'confirmed': return <CheckCircleIcon className="w-4 h-4" />
      case 'preparing': return <ClockIcon className="w-4 h-4" />
      case 'ready': return <CheckCircleIcon className="w-4 h-4" />
      case 'shipped': return <TruckIcon className="w-4 h-4" />
      case 'delivered': return <CheckCircleIcon className="w-4 h-4" />
      case 'cancelled': return <XCircleIcon className="w-4 h-4" />
      default: return <ClockIcon className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const updateOrderStatus = (orderId: number, newStatus: Order['status']) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId 
        ? { 
            ...order, 
            status: newStatus,
            ...(newStatus === 'delivered' && !order.actualDeliveryDate 
              ? { actualDeliveryDate: new Date().toISOString() } 
              : {})
          }
        : order
    ))
  }

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      totalRevenue: orders
        .filter(o => o.paymentStatus === 'paid')
        .reduce((sum, order) => sum + order.totalAmount, 0)
    }
  }

  const stats = getOrderStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
              <p className="text-gray-600 mt-1">Manage customer orders and fulfillment</p>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TruckIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.confirmed + stats.preparing + stats.ready + stats.shipped}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <ClipboardDocumentListIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <BuildingStorefrontIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{order.customer.businessInfo?.businessName || order.customer.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                      {order.priority} priority
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <TruckIcon className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Delivery Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(order.requestedDeliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-medium text-gray-900">${order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full ${
                        order.paymentStatus === 'paid' ? 'bg-green-500' :
                        order.paymentStatus === 'pending' ? 'bg-yellow-500' :
                        order.paymentStatus === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    {order.items.length} item(s) • {order.shippingMethod}
                    {order.notes && (
                      <span className="ml-2 inline-flex items-center">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                        Notes
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowOrderDetails(true)
                      }}
                      className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Orders will appear here when customers place them'
              }
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Order {selectedOrder.orderNumber}
                </h2>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedOrder.customer.businessInfo?.businessName || selectedOrder.customer.name}
                      </p>
                      {selectedOrder.customer.businessInfo && (
                        <p className="text-sm text-gray-600">
                          Contact: {selectedOrder.customer.name}
                        </p>
                      )}
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p className="flex items-center">
                          <EnvelopeIcon className="w-4 h-4 mr-2" />
                          {selectedOrder.customer.contact.email}
                        </p>
                        <p className="flex items-center">
                          <PhoneIcon className="w-4 h-4 mr-2" />
                          {selectedOrder.customer.contact.phone}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="flex items-start text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4 mr-2 mt-0.5" />
                        <span>
                          {selectedOrder.customer.contact.address.street}<br />
                          {selectedOrder.customer.contact.address.city}, {selectedOrder.customer.contact.address.state} {selectedOrder.customer.contact.address.zip}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.productName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${item.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${item.totalPrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          Total:
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          ${selectedOrder.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span className="text-gray-900">{new Date(selectedOrder.orderDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requested Delivery:</span>
                      <span className="text-gray-900">{new Date(selectedOrder.requestedDeliveryDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Method:</span>
                      <span className="text-gray-900 capitalize">{selectedOrder.shippingMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedOrder.priority)}`}>
                        {selectedOrder.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment & Status</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="text-gray-900 capitalize">{selectedOrder.paymentMethod.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    {selectedOrder.tracking && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tracking:</span>
                        <span className="text-gray-900">{selectedOrder.tracking}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Special Notes</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t flex justify-end space-x-3">
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Update Status
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
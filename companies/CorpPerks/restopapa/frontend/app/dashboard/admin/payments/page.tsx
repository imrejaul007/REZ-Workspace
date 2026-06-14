'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BanknotesIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline'

interface Payment {
  id: string
  transactionId: string
  type: 'subscription' | 'marketplace_order' | 'credit_purchase' | 'refund'
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed'
  amount: number
  currency: string
  paymentMethod: 'credit_card' | 'debit_card' | 'upi' | 'net_banking' | 'wallet'
  payer: {
    id: string
    name: string
    email: string
    type: 'restaurant' | 'employee' | 'vendor'
  }
  payee?: {
    id: string
    name: string
    type: 'restaurant' | 'vendor' | 'platform'
  }
  gateway: 'razorpay' | 'stripe' | 'paypal'
  gatewayTransactionId: string
  createdAt: string
  updatedAt: string
  description: string
  failureReason?: string
  refundReason?: string
  metadata?: any
}

const mockPayments: Payment[] = [
  {
    id: 'PAY-001',
    transactionId: 'TXN-20240115-001',
    type: 'subscription',
    status: 'completed',
    amount: 2999,
    currency: 'INR',
    paymentMethod: 'credit_card',
    payer: {
      id: '1',
      name: 'Spice Garden Restaurant',
      email: 'billing@spicegarden.com',
      type: 'restaurant'
    },
    payee: {
      id: 'platform',
      name: 'Resturistan Platform',
      type: 'platform'
    },
    gateway: 'razorpay',
    gatewayTransactionId: 'razorpay_12345',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:32:00Z',
    description: 'Premium subscription - Monthly',
    metadata: { plan: 'premium', duration: 'monthly' }
  },
  {
    id: 'PAY-002',
    transactionId: 'TXN-20240115-002',
    type: 'marketplace_order',
    status: 'failed',
    amount: 15000,
    currency: 'INR',
    paymentMethod: 'debit_card',
    payer: {
      id: '2',
      name: 'Ocean View Diner',
      email: 'orders@oceanview.com',
      type: 'restaurant'
    },
    payee: {
      id: '3',
      name: 'Fresh Supplies Co',
      type: 'vendor'
    },
    gateway: 'razorpay',
    gatewayTransactionId: 'razorpay_67890',
    createdAt: '2024-01-15T14:20:00Z',
    updatedAt: '2024-01-15T14:22:00Z',
    description: 'Order #ORD-2024-0115-001',
    failureReason: 'Insufficient funds in account',
    metadata: { orderId: 'ORD-2024-0115-001', items: 15 }
  },
  {
    id: 'PAY-003',
    transactionId: 'TXN-20240115-003',
    type: 'credit_purchase',
    status: 'completed',
    amount: 5000,
    currency: 'INR',
    paymentMethod: 'upi',
    payer: {
      id: '4',
      name: 'Tasty Bites',
      email: 'finance@tastybites.com',
      type: 'restaurant'
    },
    payee: {
      id: 'platform',
      name: 'Resturistan Platform',
      type: 'platform'
    },
    gateway: 'razorpay',
    gatewayTransactionId: 'razorpay_11111',
    createdAt: '2024-01-15T16:45:00Z',
    updatedAt: '2024-01-15T16:46:00Z',
    description: 'Platform credits purchase',
    metadata: { credits: 5000 }
  },
  {
    id: 'PAY-004',
    transactionId: 'TXN-20240114-001',
    type: 'refund',
    status: 'refunded',
    amount: 2500,
    currency: 'INR',
    paymentMethod: 'credit_card',
    payer: {
      id: '5',
      name: 'Corner Cafe',
      email: 'refunds@cornercafe.com',
      type: 'restaurant'
    },
    payee: {
      id: '6',
      name: 'Kitchen Equipment Pro',
      type: 'vendor'
    },
    gateway: 'razorpay',
    gatewayTransactionId: 'razorpay_22222',
    createdAt: '2024-01-14T09:30:00Z',
    updatedAt: '2024-01-14T11:45:00Z',
    description: 'Refund for Order #ORD-2024-0110-005',
    refundReason: 'Defective items received',
    metadata: { originalOrderId: 'ORD-2024-0110-005' }
  },
  {
    id: 'PAY-005',
    transactionId: 'TXN-20240114-002',
    type: 'marketplace_order',
    status: 'disputed',
    amount: 8500,
    currency: 'INR',
    paymentMethod: 'net_banking',
    payer: {
      id: '7',
      name: 'Urban Kitchen',
      email: 'disputes@urbankitchen.com',
      type: 'restaurant'
    },
    payee: {
      id: '8',
      name: 'Organic Farms Ltd',
      type: 'vendor'
    },
    gateway: 'razorpay',
    gatewayTransactionId: 'razorpay_33333',
    createdAt: '2024-01-14T12:15:00Z',
    updatedAt: '2024-01-14T18:30:00Z',
    description: 'Order #ORD-2024-0114-003 - Under dispute',
    failureReason: 'Chargeback initiated by customer',
    metadata: { orderId: 'ORD-2024-0114-003', disputeId: 'DSP-001' }
  }
]

const paymentStats = {
  totalVolume: 2485750,
  totalTransactions: 1547,
  successRate: 94.2,
  pendingAmount: 125000,
  failedAmount: 87500,
  refundedAmount: 45000,
  disputedAmount: 32000
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState(mockPayments)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-blue-100 text-blue-800'
      case 'disputed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'subscription': return 'Subscription'
      case 'marketplace_order': return 'Marketplace Order'
      case 'credit_purchase': return 'Credit Purchase'
      case 'refund': return 'Refund'
      default: return type
    }
  }

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesType = typeFilter === 'all' || payment.type === typeFilter
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter
    const matchesSearch = !searchQuery || 
      payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.payer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesType && matchesMethod && matchesSearch
  })

  const handleRefund = (paymentId: string) => {
    if (confirm('Are you sure you want to process this refund?')) {
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'refunded' as Payment['status'] }
          : payment
      ))
    }
  }

  if (selectedPayment) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Back to Payments</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
                  <p className="text-gray-600">{selectedPayment.transactionId}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPayment.status)}`}>
                  {selectedPayment.status.toUpperCase()}
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Details */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Information</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                    <p className="text-gray-900 font-mono">{selectedPayment.transactionId}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gateway Transaction ID</label>
                    <p className="text-gray-900 font-mono">{selectedPayment.gatewayTransactionId}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <p className="text-gray-900">{getTypeLabel(selectedPayment.type)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="text-gray-900 capitalize">{selectedPayment.paymentMethod.replace('_', ' ')}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gateway</label>
                    <p className="text-gray-900 capitalize">{selectedPayment.gateway}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="text-gray-900 text-xl font-bold">
                      {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-900">{selectedPayment.description}</p>
                </div>

                {selectedPayment.failureReason && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-medium text-red-900">Failure Reason</h4>
                    <p className="text-sm text-red-700 mt-1">{selectedPayment.failureReason}</p>
                  </div>
                )}

                {selectedPayment.refundReason && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900">Refund Reason</h4>
                    <p className="text-sm text-blue-700 mt-1">{selectedPayment.refundReason}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    View Receipt
                  </button>
                  {selectedPayment.status === 'completed' && (
                    <button 
                      onClick={() => handleRefund(selectedPayment.id)}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                    >
                      Process Refund
                    </button>
                  )}
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Contact Gateway
                  </button>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                    Export Data
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payer Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payer Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CreditCardIcon className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedPayment.payer.name}</p>
                      <p className="text-sm text-gray-600">{selectedPayment.payer.email}</p>
                    </div>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    selectedPayment.payer.type === 'restaurant' ? 'bg-blue-100 text-blue-800' :
                    selectedPayment.payer.type === 'employee' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedPayment.payer.type.charAt(0).toUpperCase() + selectedPayment.payer.type.slice(1)}
                  </span>
                </div>
              </div>

              {/* Payee Info */}
              {selectedPayment.payee && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payee Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <BanknotesIcon className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedPayment.payee.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{selectedPayment.payee.type}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Created</p>
                      <p className="text-xs text-gray-600">{formatDate(selectedPayment.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-xs text-gray-600">{formatDate(selectedPayment.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {selectedPayment.metadata && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedPayment.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                        <span className="text-sm text-gray-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
              <p className="text-gray-600">Monitor transactions, refunds, and payment issues</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Volume</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(paymentStats.totalVolume)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <CreditCardIcon className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-lg font-bold text-gray-900">{paymentStats.totalTransactions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-lg font-bold text-gray-900">{paymentStats.successRate}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(paymentStats.pendingAmount)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <XCircleIcon className="w-8 h-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(paymentStats.failedAmount)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <ArrowPathIcon className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Refunded</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(paymentStats.refundedAmount)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Disputed</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(paymentStats.disputedAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search payments..."
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
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="subscription">Subscription</option>
                <option value="marketplace_order">Marketplace Order</option>
                <option value="credit_purchase">Credit Purchase</option>
                <option value="refund">Refund</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Methods</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="upi">UPI</option>
                <option value="net_banking">Net Banking</option>
                <option value="wallet">Wallet</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CurrencyRupeeIcon className="w-4 h-4 text-green-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{payment.transactionId}</div>
                          <div className="text-xs text-gray-500 font-mono">{payment.gatewayTransactionId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getTypeLabel(payment.type)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.payer.name}</div>
                        <div className="text-xs text-gray-500">{payment.payer.type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {payment.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {payment.status === 'completed' && (
                        <button 
                          onClick={() => handleRefund(payment.id)}
                          className="text-yellow-600 hover:text-yellow-900 mr-3"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button className="text-gray-600 hover:text-gray-900">
                        <DocumentTextIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No payments found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
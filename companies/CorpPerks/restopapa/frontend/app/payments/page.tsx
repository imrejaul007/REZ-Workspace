'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CreditCardIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface PaymentMethod {
  id: number
  type: 'card' | 'bank' | 'digital'
  name: string
  details: string
  isDefault: boolean
  lastUsed: string
  status: 'active' | 'expired' | 'pending'
}

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  method: string
  reference: string
}

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 1,
    type: 'card',
    name: 'Visa ending in 4242',
    details: 'Expires 12/25',
    isDefault: true,
    lastUsed: '2 days ago',
    status: 'active'
  },
  {
    id: 2,
    type: 'bank',
    name: 'Chase Business Account',
    details: 'Account ending in 8901',
    isDefault: false,
    lastUsed: '1 week ago',
    status: 'active'
  },
  {
    id: 3,
    type: 'digital',
    name: 'PayPal',
    details: 'user@example.com',
    isDefault: false,
    lastUsed: '2 weeks ago',
    status: 'active'
  }
]

const mockTransactions: Transaction[] = [
  {
    id: 'TXN-001',
    date: '2024-03-15',
    description: 'Order from Tokyo Sushi Bar',
    amount: -125.80,
    status: 'completed',
    method: 'Visa ending in 4242',
    reference: 'ORD-2024-001235'
  },
  {
    id: 'TXN-002',
    date: '2024-03-14',
    description: 'Marketplace purchase - Fresh Supplies',
    amount: -87.45,
    status: 'completed',
    method: 'Chase Business Account',
    reference: 'ORD-2024-001234'
  },
  {
    id: 'TXN-003',
    date: '2024-03-13',
    description: 'Refund - Cancelled order',
    amount: 156.75,
    status: 'completed',
    method: 'Visa ending in 4242',
    reference: 'ORD-2024-001236'
  },
  {
    id: 'TXN-004',
    date: '2024-03-12',
    description: 'Subscription payment - Premium Plan',
    amount: -29.99,
    status: 'pending',
    method: 'PayPal',
    reference: 'SUB-2024-003'
  }
]

export default function PaymentManagement() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'methods' | 'history'>('methods')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods)
  const [transactions] = useState<Transaction[]>(mockTransactions)

  const setDefaultMethod = (methodId: number) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === methodId
      }))
    )
  }

  const removePaymentMethod = (methodId: number) => {
    if (confirm('Are you sure you want to remove this payment method?')) {
      setPaymentMethods(methods => methods.filter(method => method.id !== methodId))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-100'
      case 'pending': return 'text-yellow-700 bg-yellow-100'
      case 'failed': return 'text-red-700 bg-red-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card': return CreditCardIcon
      case 'bank': return BanknotesIcon
      case 'digital': return CreditCardIcon
      default: return CreditCardIcon
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
              <p className="text-gray-600 mt-2">Manage your payment methods and view transaction history</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Balance */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Account Balance</h2>
              <p className="text-3xl font-bold">$2,847.50</p>
              <p className="text-blue-100 text-sm mt-1">Available for withdrawal</p>
            </div>
            <div className="text-right">
              <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-lg hover:bg-white/30 transition-colors mb-2">
                Add Funds
              </button>
              <br />
              <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-lg hover:bg-white/30 transition-colors">
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('methods')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'methods'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Payment Methods
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transaction History
              </button>
            </nav>
          </div>
        </div>

        {/* Payment Methods Tab */}
        {activeTab === 'methods' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                Add Payment Method
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paymentMethods.map((method) => {
                const Icon = getMethodIcon(method.type)
                return (
                  <div key={method.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <Icon className="w-8 h-8 text-gray-600 mr-3" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{method.name}</h3>
                          <p className="text-sm text-gray-600">{method.details}</p>
                        </div>
                      </div>
                      {method.isDefault && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        method.status === 'active' ? 'bg-green-100 text-green-800' :
                        method.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {method.status}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Last used {method.lastUsed}</p>
                    </div>

                    <div className="flex gap-2">
                      {!method.isDefault && (
                        <button
                          onClick={() => setDefaultMethod(method.id)}
                          className="flex-1 text-sm text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-50"
                        >
                          Set Default
                        </button>
                      )}
                      <button className="flex-1 text-sm text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">
                        Edit
                      </button>
                      <button
                        onClick={() => removePaymentMethod(method.id)}
                        className="text-sm text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Add New Card */}
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-gray-400 transition-colors cursor-pointer">
                <PlusIcon className="w-12 h-12 text-gray-400 mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">Add Payment Method</h3>
                <p className="text-sm text-gray-600">Add a new card, bank account, or digital wallet</p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History Tab */}
        {activeTab === 'history' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
              <div className="flex gap-3">
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  Export
                </button>
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <ArrowPathIcon className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-gray-500">Ref: {transaction.reference}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'}>
                            {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <DocumentArrowDownIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {transactions.length === 0 && (
                <div className="text-center py-12">
                  <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                  <p className="text-gray-500">Your transaction history will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">$1,247.83</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">$29.99</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BanknotesIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Saved</p>
                <p className="text-2xl font-bold text-gray-900">$2,847.50</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
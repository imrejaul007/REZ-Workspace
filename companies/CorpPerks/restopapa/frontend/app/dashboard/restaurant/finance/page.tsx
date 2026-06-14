'use client'

import React, { useState } from 'react'
import { 
  CurrencyRupeeIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  ShoppingCartIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  date: string
  status: 'completed' | 'pending' | 'failed'
  invoiceNumber?: string
  gstNumber?: string
  paymentMethod: string
}

interface CreditAccount {
  id: string
  vendor: string
  creditLimit: number
  usedCredit: number
  availableCredit: number
  dueAmount: number
  dueDate: string
  interestRate: number
  paymentHistory: Array<{
    date: string
    amount: number
    status: 'paid' | 'overdue'
  }>
}

interface Invoice {
  id: string
  invoiceNumber: string
  vendorName: string
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
  subtotal: number
  gst: number
  total: number
  date: string
  dueDate: string
  status: 'paid' | 'pending' | 'overdue'
  gstNumber: string
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    category: 'Food Sales',
    description: 'Daily sales - Table service',
    amount: 15420,
    date: '2024-01-15',
    status: 'completed',
    paymentMethod: 'Cash'
  },
  {
    id: '2',
    type: 'expense',
    category: 'Inventory Purchase',
    description: 'Fresh vegetables from Mandi Suppliers',
    amount: 8500,
    date: '2024-01-15',
    status: 'pending',
    invoiceNumber: 'INV-2024-001',
    gstNumber: '07AABCU9603R1ZX',
    paymentMethod: 'Credit'
  }
]

const mockCreditAccounts: CreditAccount[] = [
  {
    id: '1',
    vendor: 'Mandi Fresh Suppliers',
    creditLimit: 50000,
    usedCredit: 25000,
    availableCredit: 25000,
    dueAmount: 8500,
    dueDate: '2024-01-30',
    interestRate: 12,
    paymentHistory: [
      { date: '2023-12-15', amount: 12000, status: 'paid' },
      { date: '2024-01-01', amount: 8500, status: 'paid' }
    ]
  },
  {
    id: '2',
    vendor: 'Metro Kitchen Equipment',
    creditLimit: 100000,
    usedCredit: 75000,
    availableCredit: 25000,
    dueAmount: 15000,
    dueDate: '2024-01-25',
    interestRate: 15,
    paymentHistory: [
      { date: '2023-12-20', amount: 25000, status: 'paid' },
      { date: '2024-01-10', amount: 15000, status: 'overdue' }
    ]
  }
]

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    vendorName: 'Mandi Fresh Suppliers',
    items: [
      { description: 'Fresh Tomatoes (20kg)', quantity: 1, rate: 2500, amount: 2500 },
      { description: 'Onions (30kg)', quantity: 1, rate: 1800, amount: 1800 },
      { description: 'Potatoes (25kg)', quantity: 1, rate: 1500, amount: 1500 }
    ],
    subtotal: 5800,
    gst: 1044,
    total: 6844,
    date: '2024-01-15',
    dueDate: '2024-01-30',
    status: 'pending',
    gstNumber: '07AABCU9603R1ZX'
  }
]

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30days')

  const totalIncome = mockTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = mockTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const netProfit = totalIncome - totalExpenses

  const totalCreditUsed = mockCreditAccounts.reduce((sum, acc) => sum + acc.usedCredit, 0)
  const totalCreditLimit = mockCreditAccounts.reduce((sum, acc) => sum + acc.creditLimit, 0)
  const totalDueAmount = mockCreditAccounts.reduce((sum, acc) => sum + acc.dueAmount, 0)

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Income</p>
              <p className="text-2xl font-semibold text-green-900">₹{totalIncome.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingDownIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Total Expenses</p>
              <p className="text-2xl font-semibold text-red-900">₹{totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`${netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border rounded-lg p-6`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className={`h-8 w-8 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Net Profit/Loss</p>
              <p className={`text-2xl font-semibold ${netProfit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                ₹{netProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Amount Due</p>
              <p className="text-2xl font-semibold text-yellow-900">₹{totalDueAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Credit Limit</span>
              <span className="font-semibold">₹{totalCreditLimit.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Used Credit</span>
              <span className="font-semibold text-red-600">₹{totalCreditUsed.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Available Credit</span>
              <span className="font-semibold text-green-600">₹{(totalCreditLimit - totalCreditUsed).toLocaleString()}</span>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Credit Utilization</span>
                <span>{Math.round((totalCreditUsed / totalCreditLimit) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(totalCreditUsed / totalCreditLimit) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {mockTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-xs text-gray-500">{transaction.date} • {transaction.paymentMethod}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderTransactionsTab = () => (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
          <div className="flex items-center space-x-4">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="1year">Last year</option>
            </select>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    {transaction.invoiceNumber && (
                      <p className="text-xs text-gray-500">Invoice: {transaction.invoiceNumber}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.paymentMethod}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderCreditTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Credit Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Credit Limit</p>
                <p className="text-2xl font-semibold text-blue-900">₹{totalCreditLimit.toLocaleString()}</p>
              </div>
              <CreditCardIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Used Credit</p>
                <p className="text-2xl font-semibold text-red-900">₹{totalCreditUsed.toLocaleString()}</p>
              </div>
              <BanknotesIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Available Credit</p>
                <p className="text-2xl font-semibold text-green-900">₹{(totalCreditLimit - totalCreditUsed).toLocaleString()}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {mockCreditAccounts.map((account) => (
            <div key={account.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{account.vendor}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Interest Rate: {account.interestRate}%</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    new Date(account.dueDate) < new Date() ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    Due: {new Date(account.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Credit Limit</p>
                  <p className="text-lg font-semibold">₹{account.creditLimit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Used Credit</p>
                  <p className="text-lg font-semibold text-red-600">₹{account.usedCredit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available Credit</p>
                  <p className="text-lg font-semibold text-green-600">₹{account.availableCredit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Amount</p>
                  <p className="text-lg font-semibold text-yellow-600">₹{account.dueAmount.toLocaleString()}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Credit Utilization</span>
                  <span>{Math.round((account.usedCredit / account.creditLimit) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (account.usedCredit / account.creditLimit) > 0.8 ? 'bg-red-500' :
                      (account.usedCredit / account.creditLimit) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(account.usedCredit / account.creditLimit) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recent Payments</h4>
                  <div className="space-y-1">
                    {account.paymentHistory.slice(0, 2).map((payment, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-500">{new Date(payment.date).toLocaleDateString()}:</span>
                        <span className="font-medium">₹{payment.amount.toLocaleString()}</span>
                        <span className={`px-1 py-0.5 text-xs rounded ${
                          payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                    View Details
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    Make Payment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderInvoicesTab = () => (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">GST Invoices</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Generate Invoice
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {mockInvoices.map((invoice) => (
            <div key={invoice.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Invoice #{invoice.invoiceNumber}</h3>
                  <p className="text-gray-600">{invoice.vendorName}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">₹{invoice.total.toLocaleString()}</p>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Invoice Date: <span className="text-gray-900">{new Date(invoice.date).toLocaleDateString()}</span></p>
                  <p className="text-gray-500">Due Date: <span className="text-gray-900">{new Date(invoice.dueDate).toLocaleDateString()}</span></p>
                </div>
                <div>
                  <p className="text-gray-500">GST Number: <span className="text-gray-900">{invoice.gstNumber}</span></p>
                  <p className="text-gray-500">Status: <span className="capitalize text-gray-900">{invoice.status}</span></p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Rate</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoice.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">{item.description}</td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">₹{item.rate.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">₹{item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 bg-gray-50 rounded p-4">
                  <div className="flex justify-end space-y-1">
                    <div className="w-64 space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{invoice.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (18%):</span>
                        <span>₹{invoice.gst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Total:</span>
                        <span>₹{invoice.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 mt-4">
                <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                  Download PDF
                </button>
                <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                  Send Email
                </button>
                {invoice.status === 'pending' && (
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Finance & Credit Management</h1>
        <p className="text-gray-600 mt-2">Manage your finances, track expenses, and handle credit accounts</p>
      </div>

      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-1 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-2 px-1 ${activeTab === 'transactions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={`pb-2 px-1 ${activeTab === 'credit' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Credit Management
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-2 px-1 ${activeTab === 'invoices' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            GST Invoices
          </button>
        </div>
      </div>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'transactions' && renderTransactionsTab()}
      {activeTab === 'credit' && renderCreditTab()}
      {activeTab === 'invoices' && renderInvoicesTab()}
    </div>
  )
}
'use client';

import { useState } from 'react';

interface Payment {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet' | 'bank_transfer';
  status: 'completed' | 'pending' | 'failed' | 'refunded' | 'disputed';
  date: string;
  transactionId?: string;
  fees: number;
  netAmount: number;
  refundAmount?: number;
  disputeReason?: string;
}

interface Subscription {
  id: string;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  monthlyFee: number;
  startDate: string;
  nextBilling: string;
  features: string[];
  discount?: number;
}

interface Payout {
  id: string;
  period: string;
  totalRevenue: number;
  platformFee: number;
  netPayout: number;
  status: 'pending' | 'processed' | 'failed';
  processedDate?: string;
  bankAccount: string;
  paymentReference?: string;
}

export default function PaymentsBilling() {
  const [activeTab, setActiveTab] = useState<'payments' | 'subscription' | 'payouts' | 'billing'>('payments');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const payments: Payment[] = [
    {
      id: 'pay_001',
      orderNumber: 'ORD-2025-0001',
      customerName: 'Rajesh Kumar',
      amount: 1370,
      paymentMethod: 'upi',
      status: 'completed',
      date: '2025-01-15 19:30:00',
      transactionId: 'TXN123456789',
      fees: 27.4,
      netAmount: 1342.6
    },
    {
      id: 'pay_002',
      orderNumber: 'ORD-2025-0002',
      customerName: 'Priya Sharma',
      amount: 620,
      paymentMethod: 'cash',
      status: 'completed',
      date: '2025-01-15 19:45:00',
      transactionId: '',
      fees: 0,
      netAmount: 620
    },
    {
      id: 'pay_003',
      orderNumber: 'ORD-2025-0003',
      customerName: 'Amit Singh',
      amount: 1670,
      paymentMethod: 'card',
      status: 'completed',
      date: '2025-01-15 20:00:00',
      transactionId: 'TXN987654321',
      fees: 41.75,
      netAmount: 1628.25
    },
    {
      id: 'pay_004',
      orderNumber: 'ORD-2025-0004',
      customerName: 'Neha Patel',
      amount: 380,
      paymentMethod: 'wallet',
      status: 'completed',
      date: '2025-01-15 18:30:00',
      transactionId: 'TXN456789123',
      fees: 7.6,
      netAmount: 372.4
    },
    {
      id: 'pay_005',
      orderNumber: 'ORD-2025-0005',
      customerName: 'Vikash Agarwal',
      amount: 220,
      paymentMethod: 'upi',
      status: 'refunded',
      date: '2025-01-15 19:00:00',
      transactionId: 'TXN789123456',
      fees: 4.4,
      netAmount: 215.6,
      refundAmount: 220
    },
    {
      id: 'pay_006',
      orderNumber: 'ORD-2025-0006',
      customerName: 'Sunita Verma',
      amount: 580,
      paymentMethod: 'card',
      status: 'disputed',
      date: '2025-01-15 20:15:00',
      transactionId: 'TXN321654987',
      fees: 14.5,
      netAmount: 565.5,
      disputeReason: 'Customer claims order was not delivered'
    },
    {
      id: 'pay_007',
      orderNumber: 'ORD-2025-0007',
      customerName: 'Kavita Reddy',
      amount: 890,
      paymentMethod: 'upi',
      status: 'failed',
      date: '2025-01-15 21:00:00',
      transactionId: 'TXN654987321',
      fees: 0,
      netAmount: 0
    }
  ];

  const subscription: Subscription = {
    id: 'sub_001',
    plan: 'premium',
    status: 'active',
    monthlyFee: 2999,
    startDate: '2024-12-01',
    nextBilling: '2025-02-01',
    features: [
      'Unlimited menu items',
      'Advanced analytics',
      'Priority support',
      'Multi-location management',
      'Custom branding',
      'API access'
    ],
    discount: 15
  };

  const payouts: Payout[] = [
    {
      id: 'payout_001',
      period: 'Jan 8-14, 2025',
      totalRevenue: 45600,
      platformFee: 4560,
      netPayout: 41040,
      status: 'processed',
      processedDate: '2025-01-15 10:00:00',
      bankAccount: '****1234',
      paymentReference: 'PYT202501150001'
    },
    {
      id: 'payout_002',
      period: 'Jan 1-7, 2025',
      totalRevenue: 38900,
      platformFee: 3890,
      netPayout: 35010,
      status: 'processed',
      processedDate: '2025-01-08 10:00:00',
      bankAccount: '****1234',
      paymentReference: 'PYT202501080001'
    },
    {
      id: 'payout_003',
      period: 'Jan 15-21, 2025',
      totalRevenue: 42300,
      platformFee: 4230,
      netPayout: 38070,
      status: 'pending',
      bankAccount: '****1234'
    }
  ];

  const billingHistory = [
    {
      id: 'bill_001',
      date: '2025-01-01',
      description: 'Premium Plan - January 2025',
      amount: 2999,
      status: 'paid',
      paymentMethod: 'card',
      invoiceNumber: 'INV-2025-001'
    },
    {
      id: 'bill_002',
      date: '2024-12-01',
      description: 'Premium Plan - December 2024',
      amount: 2999,
      status: 'paid',
      paymentMethod: 'card',
      invoiceNumber: 'INV-2024-012'
    },
    {
      id: 'bill_003',
      date: '2024-11-01',
      description: 'Basic Plan - November 2024',
      amount: 999,
      status: 'paid',
      paymentMethod: 'upi',
      invoiceNumber: 'INV-2024-011'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'active': case 'paid': case 'processed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': case 'cancelled': case 'expired': return 'bg-red-100 text-red-800';
      case 'refunded': case 'disputed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'upi': return '📱';
      case 'wallet': return '👛';
      case 'bank_transfer': return '🏦';
      default: return '💰';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    const matchesMethod = selectedMethod === 'all' || payment.paymentMethod === selectedMethod;
    const matchesSearch = searchTerm === '' ||
      payment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesMethod && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const totalFees = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.fees, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const refundedAmount = payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + (p.refundAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payments & Billing</h1>
          <p className="mt-2 text-gray-600">Manage payments, subscriptions, and financial records</p>
        </div>

        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment History ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subscription'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Subscription
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payouts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payouts ({payouts.length})
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'billing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Billing History
            </button>
          </nav>
        </div>

        {activeTab === 'payments' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-green-600 text-xl">💰</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalRevenue)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <span className="text-red-600 text-xl">📊</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Fees</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalFees)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-yellow-600 text-xl">⏳</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(pendingAmount)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <span className="text-orange-600 text-xl">↩️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Refunded Amount</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(refundedAmount)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 flex flex-col lg:flex-row gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <select 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="disputed">Disputed</option>
                </select>
                
                <select 
                  value={selectedMethod} 
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="wallet">Wallet</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Payment Transactions</h3>
                <p className="text-sm text-gray-500">Showing {filteredPayments.length} of {payments.length} payments</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order & Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fees
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Amount
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
                          <div>
                            <div className="text-sm font-medium text-gray-900">{payment.orderNumber}</div>
                            <div className="text-sm text-gray-500">{payment.customerName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-xl mr-2">{getMethodIcon(payment.paymentMethod)}</span>
                            <span className="text-sm text-gray-900 capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payment.fees)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payment.netAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'subscription' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Current Subscription</h3>
                <p className="text-sm text-gray-500">Manage your subscription plan and billing</p>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPlanColor(subscription.plan)}`}>
                        {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                        {subscription.status}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {formatCurrency(subscription.monthlyFee)}/month
                    </p>
                    {subscription.discount && (
                      <p className="text-sm text-green-600">
                        {subscription.discount}% discount applied
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-2">
                      Upgrade Plan
                    </button>
                    <div className="text-sm text-gray-500">
                      Next billing: {new Date(subscription.nextBilling).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Plan Features</h4>
                    <ul className="space-y-2">
                      {subscription.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Started:</span>
                        <span className="text-gray-900">
                          {new Date(subscription.startDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Next Billing:</span>
                        <span className="text-gray-900">
                          {new Date(subscription.nextBilling).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Monthly Amount:</span>
                        <span className="text-gray-900">{formatCurrency(subscription.monthlyFee)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="bg-gray-100 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Available Plans</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <h5 className="font-medium text-gray-900">Basic</h5>
                    <p className="text-2xl font-bold text-gray-900">₹999/mo</p>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                      <li>• Up to 50 menu items</li>
                      <li>• Basic analytics</li>
                      <li>• Email support</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-2 border-purple-500">
                    <h5 className="font-medium text-purple-900">Premium (Current)</h5>
                    <p className="text-2xl font-bold text-purple-900">₹2,999/mo</p>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                      <li>• Unlimited menu items</li>
                      <li>• Advanced analytics</li>
                      <li>• Priority support</li>
                      <li>• Multi-location</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <h5 className="font-medium text-gray-900">Enterprise</h5>
                    <p className="text-2xl font-bold text-gray-900">₹9,999/mo</p>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                      <li>• Everything in Premium</li>
                      <li>• Custom integrations</li>
                      <li>• Dedicated support</li>
                      <li>• White-label options</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Weekly Payouts</h3>
              <p className="text-sm text-gray-500">Your earnings are paid out weekly</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platform Fee (10%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Payout
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processed Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bank Account
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payout.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payout.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        -{formatCurrency(payout.platformFee)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(payout.netPayout)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payout.status)}`}>
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payout.processedDate ? 
                          new Date(payout.processedDate).toLocaleDateString('en-IN') : 
                          'Pending'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payout.bankAccount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Billing History</h3>
              <p className="text-sm text-gray-500">Your subscription and service charges</p>
            </div>
            
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
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billingHistory.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(bill.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bill.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(bill.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {bill.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">
                          Download {bill.invoiceNumber}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order Number</label>
                    <p className="text-sm text-gray-900">{selectedPayment.orderNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer</label>
                    <p className="text-sm text-gray-900">{selectedPayment.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Method</label>
                    <p className="text-sm text-gray-900 capitalize flex items-center">
                      <span className="mr-2">{getMethodIcon(selectedPayment.paymentMethod)}</span>
                      {selectedPayment.paymentMethod.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                    <p className="text-sm text-gray-900">{selectedPayment.transactionId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date & Time</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedPayment.date).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                      {selectedPayment.status}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Order Amount</span>
                      <span className="text-sm text-gray-900">{formatCurrency(selectedPayment.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Processing Fees</span>
                      <span className="text-sm text-red-600">-{formatCurrency(selectedPayment.fees)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-sm text-gray-900">Net Amount</span>
                      <span className="text-sm text-gray-900">{formatCurrency(selectedPayment.netAmount)}</span>
                    </div>
                    {selectedPayment.refundAmount && (
                      <div className="flex justify-between">
                        <span className="text-sm text-orange-500">Refund Amount</span>
                        <span className="text-sm text-orange-500">{formatCurrency(selectedPayment.refundAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPayment.disputeReason && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-500">Dispute Reason</label>
                    <p className="text-sm text-gray-900">{selectedPayment.disputeReason}</p>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
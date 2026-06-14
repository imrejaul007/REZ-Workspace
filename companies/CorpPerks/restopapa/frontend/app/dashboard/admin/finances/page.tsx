'use client';

import { useState } from 'react';

interface Transaction {
  id: string;
  type: 'revenue' | 'commission' | 'fee' | 'refund' | 'payout';
  amount: number;
  currency: string;
  description: string;
  restaurantId?: string;
  restaurantName?: string;
  employeeId?: string;
  employeeName?: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  date: string;
  paymentMethod?: string;
  metadata?: any;
}

interface FinancialSummary {
  totalRevenue: number;
  totalCommission: number;
  totalRefunds: number;
  totalPayouts: number;
  netIncome: number;
  growthRate: number;
  activeSubscriptions: number;
  averageOrderValue: number;
}

export default function FinancialAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const summary: FinancialSummary = {
    totalRevenue: 2847593.45,
    totalCommission: 284759.35,
    totalRefunds: 45820.12,
    totalPayouts: 2516954.98,
    netIncome: 284759.35,
    growthRate: 15.7,
    activeSubscriptions: 1247,
    averageOrderValue: 485.60
  };

  const transactions: Transaction[] = [
    {
      id: 'TXN-2025-001',
      type: 'revenue',
      amount: 12500.00,
      currency: 'INR',
      description: 'Marketplace order commission - Order #ORD-2025-5432',
      restaurantId: 'rest_001',
      restaurantName: 'Spice Garden Delhi',
      status: 'completed',
      date: '2025-01-15 14:30:00',
      paymentMethod: 'razorpay',
      metadata: { orderId: 'ORD-2025-5432', commissionRate: 0.15 }
    },
    {
      id: 'TXN-2025-002', 
      type: 'commission',
      amount: 8750.00,
      currency: 'INR',
      description: 'Job posting premium placement fee',
      restaurantId: 'rest_002',
      restaurantName: 'Mumbai Tadka House',
      status: 'completed',
      date: '2025-01-15 11:15:00',
      paymentMethod: 'stripe',
      metadata: { jobId: 'JOB-2025-1123', placementType: 'premium' }
    },
    {
      id: 'TXN-2025-003',
      type: 'payout',
      amount: -45600.00,
      currency: 'INR',
      description: 'Weekly payout to restaurant',
      restaurantId: 'rest_003',
      restaurantName: 'Coastal Curry Co',
      status: 'pending',
      date: '2025-01-15 09:00:00',
      paymentMethod: 'bank_transfer',
      metadata: { payoutPeriod: '2025-W02', ordersCount: 67 }
    },
    {
      id: 'TXN-2025-004',
      type: 'refund',
      amount: -2400.00,
      currency: 'INR',
      description: 'Order refund - Customer complaint',
      restaurantId: 'rest_001',
      restaurantName: 'Spice Garden Delhi',
      status: 'completed',
      date: '2025-01-14 16:45:00',
      paymentMethod: 'razorpay',
      metadata: { orderId: 'ORD-2025-5401', reason: 'quality_issue' }
    },
    {
      id: 'TXN-2025-005',
      type: 'fee',
      amount: 1200.00,
      currency: 'INR',
      description: 'Employee profile verification fee',
      employeeId: 'emp_234',
      employeeName: 'Rajesh Kumar',
      status: 'completed',
      date: '2025-01-14 13:20:00',
      paymentMethod: 'upi',
      metadata: { verificationType: 'background_check' }
    },
    {
      id: 'TXN-2025-006',
      type: 'revenue',
      amount: 35000.00,
      currency: 'INR',
      description: 'Monthly subscription - Enterprise Plan',
      restaurantId: 'rest_004',
      restaurantName: 'Rajdhani Thali Express',
      status: 'completed',
      date: '2025-01-14 10:00:00',
      paymentMethod: 'razorpay',
      metadata: { planType: 'enterprise', billingPeriod: 'monthly' }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'revenue': return 'bg-blue-100 text-blue-800';
      case 'commission': return 'bg-purple-100 text-purple-800';
      case 'fee': return 'bg-indigo-100 text-indigo-800';
      case 'refund': return 'bg-red-100 text-red-800';
      case 'payout': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const formatGrowthRate = (rate: number) => {
    return rate > 0 ? `+${rate}%` : `${rate}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Financial Analytics</h1>
          <p className="mt-2 text-gray-600">Track revenue, commissions, payouts, and financial metrics</p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
          
          <select 
            value={selectedFilter} 
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Transactions</option>
            <option value="revenue">Revenue Only</option>
            <option value="commission">Commissions Only</option>
            <option value="payout">Payouts Only</option>
            <option value="refund">Refunds Only</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
              <p className="ml-2 text-sm font-medium text-green-600">{formatGrowthRate(summary.growthRate)}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs previous period</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Total Commission</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.totalCommission)}</p>
              <p className="ml-2 text-sm font-medium text-green-600">+12.3%</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">Platform earnings</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Total Payouts</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.totalPayouts)}</p>
              <p className="ml-2 text-sm font-medium text-blue-600">+18.7%</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">To partners</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Net Income</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.netIncome)}</p>
              <p className="ml-2 text-sm font-medium text-green-600">+15.2%</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">After payouts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                  <span className="text-sm text-gray-700">Marketplace Orders</span>
                </div>
                <span className="text-sm font-medium text-gray-900">65%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                  <span className="text-sm text-gray-700">Subscriptions</span>
                </div>
                <span className="text-sm font-medium text-gray-900">25%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
                  <span className="text-sm text-gray-700">Job Postings</span>
                </div>
                <span className="text-sm font-medium text-gray-900">7%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                  <span className="text-sm text-gray-700">Verification Fees</span>
                </div>
                <span className="text-sm font-medium text-gray-900">3%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Subscriptions</span>
                <span className="text-sm font-medium text-gray-900">{summary.activeSubscriptions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Order Value</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(summary.averageOrderValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Refund Rate</span>
                <span className="text-sm font-medium text-gray-900">1.6%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Payment Success Rate</span>
                <span className="text-sm font-medium text-green-600">98.7%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
          </div>
          
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
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{transaction.id}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{transaction.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                        {transaction.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                        {transaction.amount < 0 ? '-' : '+'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.restaurantName || transaction.employeeName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing 1-6 of 234 transactions
              </div>
              <div className="flex space-x-1">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white">Previous</button>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
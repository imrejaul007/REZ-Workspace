'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import PaymentHistory from './PaymentHistory';

interface DashboardData {
  overview: {
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    successRate: number;
    totalAmount: number;
    averageAmount: number;
  };
  breakdown: {
    byGateway: Array<{
      paymentGateway: string;
      _count: { id: number };
      _sum: { amount: number };
    }>;
    byMethod: Array<{
      method: string;
      _count: { id: number };
      _sum: { amount: number };
    }>;
  };
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    method: string;
    createdAt: string;
    order?: {
      orderNumber: string;
    };
  }>;
}

export const PaymentDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7'); // days
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const days = parseInt(dateRange);
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(`/api/payments/admin/dashboard?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('restauranthub_token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getGatewayChartData = () => {
    if (!dashboardData?.breakdown.byGateway) return [];
    
    return dashboardData.breakdown.byGateway.map(item => ({
      name: item.paymentGateway || 'Unknown',
      value: item._sum.amount || 0,
      count: item._count.id,
    }));
  };

  const getMethodChartData = () => {
    if (!dashboardData?.breakdown.byMethod) return [];
    
    return dashboardData.breakdown.byMethod.map(item => ({
      name: item.method || 'Unknown',
      value: item._sum.amount || 0,
      count: item._count.id,
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6 text-center text-gray-500">
        Failed to load dashboard data
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Dashboard</h1>
          <p className="text-gray-600">Monitor payment transactions and performance</p>
        </div>
        
        <div className="flex gap-2">
          <Select
            value={dateRange}
            onValueChange={(value) => setDateRange(value)}
          >
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchDashboardData} variant="outline" >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'analytics', name: 'Analytics' },
            { id: 'transactions', name: 'Transactions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardData.overview.totalAmount)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Successful</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.overview.successfulPayments}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.overview.failedPayments}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.overview.successRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Payments */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
            <div className="space-y-3">
              {dashboardData.recentPayments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      payment.status === 'PAID' ? 'bg-green-500' :
                      payment.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">
                        {payment.order?.orderNumber || payment.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.method} • {format(new Date(payment.createdAt), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Gateway Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue by Payment Gateway</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getGatewayChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getGatewayChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Payment Method Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Transactions by Payment Method</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getMethodChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [value, 'Transactions']} />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Summary Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Gateway Performance</h3>
              <div className="space-y-3">
                {getGatewayChartData().map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <span className="font-medium">{item.name}</span>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(item.value)}</div>
                      <div className="text-sm text-gray-500">{item.count} transactions</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Method Performance</h3>
              <div className="space-y-3">
                {getMethodChartData().map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <span className="font-medium">{item.name?.toUpperCase() || 'Unknown'}</span>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(item.value)}</div>
                      <div className="text-sm text-gray-500">{item.count} transactions</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <PaymentHistory showAllTransactions={true} />
      )}
    </div>
  );
};

export default PaymentDashboard;
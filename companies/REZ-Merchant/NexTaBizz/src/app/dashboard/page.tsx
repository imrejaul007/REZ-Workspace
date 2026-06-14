'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { businessApi, analyticsApi } from '@/lib/api';
import Dashboard from '@/components/Dashboard';
import BusinessCard from '@/components/BusinessCard';
import { clsx } from 'clsx';
import {
  Store,
  Plus,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  RefreshCw,
  Bell,
  Settings,
  Search
} from 'lucide-react';

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: businesses, isLoading: businessesLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => businessApi.listBusinesses({ limit: 10 })
  });

  const firstBusinessId = businesses?.data[0]?.businessId;

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', firstBusinessId, selectedPeriod],
    queryFn: () => analyticsApi.getBusinessAnalytics(firstBusinessId!, selectedPeriod),
    enabled: !!firstBusinessId
  });

  const { data: summary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: analyticsApi.getAnalyticsSummary
  });

  const filteredBusinesses = businesses?.data.filter((business) =>
    business.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search businesses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                />
              </div>

              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Settings */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Store className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +2
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {summary?.totalBusinesses || 0}
            </h3>
            <p className="text-sm text-gray-500">Total Businesses</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0
              }).format(summary?.totalRevenue || 0)}
            </h3>
            <p className="text-sm text-gray-500">Total Revenue</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +8%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {(summary?.totalOrders || 0).toLocaleString()}
            </h3>
            <p className="text-sm text-gray-500">Total Orders</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +5%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {(summary?.totalCustomers || 0).toLocaleString()}
            </h3>
            <p className="text-sm text-gray-500">Total Customers</p>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {businesses?.data[0] && (
          <div className="mb-8">
            <Dashboard
              analytics={analytics || null}
              business={businesses.data[0]}
              period={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
          </div>
        )}

        {/* My Businesses */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">My Businesses</h2>
            <a
              href="/business/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Business
            </a>
          </div>

          {businessesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-xl h-96" />
              ))}
            </div>
          ) : filteredBusinesses && filteredBusinesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((business) => (
                <BusinessCard
                  key={business.businessId}
                  business={business}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No businesses yet
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by creating your first business.
              </p>
              <a
                href="/business/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Business
              </a>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

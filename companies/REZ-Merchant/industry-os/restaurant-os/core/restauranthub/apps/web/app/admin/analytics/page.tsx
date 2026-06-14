'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import PaymentDashboard from '../../../components/payments/PaymentDashboard';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalRestaurants, setTotalRestaurants] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoadingStats(true);
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const [usersRes, restaurantsRes] = await Promise.allSettled([
          fetch(`${API_BASE}/admin/users`, { headers }),
          fetch(`${API_BASE}/admin/restaurants`, { headers }),
        ]);

        if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
          const data = await usersRes.value.json();
          const count = data.total ?? data.count ?? (Array.isArray(data) ? data.length : (Array.isArray(data?.users) ? data.users.length : null));
          setTotalUsers(count);
        }

        if (restaurantsRes.status === 'fulfilled' && restaurantsRes.value.ok) {
          const data = await restaurantsRes.value.json();
          const count = data.total ?? data.count ?? (Array.isArray(data) ? data.length : (Array.isArray(data?.restaurants) ? data.restaurants.length : null));
          setTotalRestaurants(count);
        }
      } catch {
        // silently handle — show whatever was fetched
      } finally {
        setLoadingStats(false);
      }
    };

    fetchCounts();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
        </div>
        
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" >
            <CalendarDaysIcon className="w-4 h-4 mr-2" />
            Custom Range
          </Button>
          
          <Button >
            Export Report
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'revenue', name: 'Revenue' },
            { id: 'users', name: 'Users' },
            { id: 'restaurants', name: 'Restaurants' },
            { id: 'payments', name: 'Payments' },
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">—</p>
                  <p className="text-sm text-gray-500 mt-1">Analytics data loading...</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">—</p>
                  <p className="text-sm text-gray-500 mt-1">Analytics data loading...</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingStats ? '...' : totalUsers !== null ? totalUsers.toLocaleString() : '—'}
                  </p>
                  {!loadingStats && totalUsers === null && (
                    <p className="text-sm text-gray-500 mt-1">No data available</p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BuildingStorefrontIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Restaurants</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingStats ? '...' : totalRestaurants !== null ? totalRestaurants.toLocaleString() : '—'}
                  </p>
                  {!loadingStats && totalRestaurants === null && (
                    <p className="text-sm text-gray-500 mt-1">No data available</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Charts empty state */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
              <div className="flex items-center justify-center h-[300px] text-gray-500 text-sm">
                Analytics data loading...
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Order Distribution</h3>
              <div className="flex items-center justify-center h-[300px] text-gray-500 text-sm">
                Analytics data loading...
              </div>
            </Card>
          </div>

          {/* Tables empty state */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Cities by Revenue</h3>
              <div className="flex items-center justify-center h-[120px] text-gray-500 text-sm">
                Analytics data loading...
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Restaurants</h3>
              <div className="flex items-center justify-center h-[120px] text-gray-500 text-sm">
                Analytics data loading...
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Revenue & Orders</h3>
            <div className="flex items-center justify-center h-[400px] text-gray-500 text-sm">
              Analytics data loading...
            </div>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">User Growth by Type</h3>
            <div className="flex items-center justify-center h-[400px] text-gray-500 text-sm">
              Analytics data loading...
            </div>
          </Card>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <PaymentDashboard />
      )}
    </div>
  );
}
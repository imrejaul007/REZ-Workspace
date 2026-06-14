'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function DrillDownReportsPage() {
  const [selectedMetric, setSelectedMetric] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const fetchUserMetrics = async () => {
      setLoadingUsers(true);
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/admin/users`, { headers });
        if (res.ok) {
          const data = await res.json();
          const count = data.total ?? data.count ?? (Array.isArray(data) ? data.length : (Array.isArray(data?.users) ? data.users.length : null));
          setTotalUsers(count);
        }
      } catch {
        // silently handle
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUserMetrics();
  }, []);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    toast.success(`Exporting drill-down report as ${format.toUpperCase()}...`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drill-Down Reports</h1>
          <p className="text-gray-600 mt-1">Deep dive into platform analytics and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline"  onClick={() => handleExport('pdf')}>
            Export PDF
          </Button>
          <Button variant="outline"  onClick={() => handleExport('excel')}>
            Export Excel
          </Button>
          <Button variant="outline"  onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger>
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="restaurants">Restaurants</SelectItem>
                <SelectItem value="customers">Customers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="mumbai">Mumbai</SelectItem>
                <SelectItem value="delhi">Delhi</SelectItem>
                <SelectItem value="bangalore">Bangalore</SelectItem>
                <SelectItem value="chennai">Chennai</SelectItem>
                <SelectItem value="kolkata">Kolkata</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fine-dining">Fine Dining</SelectItem>
                <SelectItem value="casual-dining">Casual Dining</SelectItem>
                <SelectItem value="quick-service">Quick Service</SelectItem>
                <SelectItem value="cafe">Cafe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">—</p>
              <p className="text-sm text-gray-500 mt-1">Select a report to drill down</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">—</p>
              <p className="text-sm text-gray-500 mt-1">Select a report to drill down</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingUsers ? '...' : totalUsers !== null ? totalUsers.toLocaleString() : '—'}
              </p>
              {!loadingUsers && totalUsers === null && (
                <p className="text-sm text-gray-500 mt-1">No data available</p>
              )}
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">—</p>
              <p className="text-sm text-gray-500 mt-1">Select a report to drill down</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Empty state — select a report to drill down */}
      {!selectedMetric ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center text-gray-500 space-y-3">
            <ChartBarIcon className="w-12 h-12 text-gray-300" />
            <p className="text-lg font-medium text-gray-600">Select a report to drill down</p>
            <p className="text-sm">Use the Metric filter above to choose what to analyse.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
            Analytics data loading...
          </div>
        </Card>
      )}
    </motion.div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Store,
  Users,
  BarChart3,
  Settings,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Supplier {
  id: string;
  name: string;
  category: string;
  rating: number;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  productCount: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function MarketplaceDashboard() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [suppliersRes, categoriesRes] = await Promise.allSettled([
        fetch(`${API_BASE}/marketplace/suppliers`, { headers }),
        fetch(`${API_BASE}/marketplace/categories`, { headers }),
      ]);

      if (suppliersRes.status === 'fulfilled' && suppliersRes.value.ok) {
        const data = await suppliersRes.value.json();
        setSuppliers(Array.isArray(data) ? data : data.suppliers || []);
      }

      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
        const data = await categoriesRes.value.json();
        setCategories(Array.isArray(data) ? data : data.categories || []);
      }
    } catch {
      // silently handle — show whatever was fetched
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeSuppliers = suppliers.filter(s => s.isActive).length;

  const quickActions = [
    {
      title: 'Manage Categories',
      description: 'Add, edit, and organize marketplace categories',
      href: '/admin/marketplace/categories',
      icon: Package,
      color: 'bg-blue-500 hover:bg-blue-600',
      stats: `${categories.length} categories`,
    },
    {
      title: 'Product Management',
      description: 'Manage trending, new, and bestseller promotions',
      href: '/admin/marketplace/products',
      icon: Store,
      color: 'bg-green-500 hover:bg-green-600',
      stats: 'Manage promotions',
    },
    {
      title: 'Vendor Management',
      description: 'Manage vendor profiles and promotions',
      href: '/admin/marketplace/vendors',
      icon: Users,
      color: 'bg-purple-500 hover:bg-purple-600',
      stats: `${suppliers.length} suppliers`,
    },
    {
      title: 'Orders and Analytics',
      description: 'View sales data and performance metrics',
      href: '/admin/marketplace/orders',
      icon: BarChart3,
      color: 'bg-orange-500 hover:bg-orange-600',
      stats: 'View reports',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace Dashboard</h1>
          <p className="mt-2 text-gray-600">Marketplace management and vendor overview</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Suppliers</CardTitle>
            <div className="text-3xl font-bold">
              {loading ? '...' : suppliers.length}
            </div>
            <p className="text-xs opacity-80">{activeSuppliers} active</p>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Categories</CardTitle>
            <div className="text-3xl font-bold">
              {loading ? '...' : categories.length}
            </div>
            <p className="text-xs opacity-80">Active categories</p>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Revenue</CardTitle>
            <div className="text-3xl font-bold">—</div>
            <p className="text-xs opacity-80">Analytics endpoint coming soon</p>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Orders</CardTitle>
            <div className="text-3xl font-bold">—</div>
            <p className="text-xs opacity-80">Order analytics coming soon</p>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Fast access to marketplace management tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href}>
                    <div className={`p-4 rounded-lg text-white ${action.color} transition-all cursor-pointer hover:scale-105`}>
                      <div className="flex items-start space-x-3">
                        <Icon className="h-6 w-6 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                          <p className="text-xs opacity-90 mb-2">{action.description}</p>
                          <div className="text-xs opacity-75">{action.stats}</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Recent Suppliers
            </CardTitle>
            <CardDescription>Latest registered marketplace suppliers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No suppliers registered yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suppliers.slice(0, 5).map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                      <div className="text-xs text-gray-500">{supplier.category}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
                {suppliers.length > 5 && (
                  <p className="text-xs text-center text-gray-500">+{suppliers.length - 5} more suppliers</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

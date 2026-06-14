'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  lowStockAlerts: number;
  pendingOrders: number;
}

interface SalesTrend {
  date: string;
  revenue: number;
  orders: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    lowStockAlerts: 0,
    pendingOrders: 0,
  });
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data - in production, fetch from analytics service
    setTimeout(() => {
      setStats({
        totalProducts: 1250,
        totalOrders: 3847,
        totalCustomers: 5420,
        totalRevenue: 1250000,
        lowStockAlerts: 23,
        pendingOrders: 12,
      });
      setSalesTrend([
        { date: 'Mon', revenue: 45000, orders: 120 },
        { date: 'Tue', revenue: 52000, orders: 145 },
        { date: 'Wed', revenue: 48000, orders: 132 },
        { date: 'Thu', revenue: 61000, orders: 168 },
        { date: 'Fri', revenue: 72000, orders: 195 },
        { date: 'Sat', revenue: 85000, orders: 230 },
        { date: 'Sun', revenue: 68000, orders: 185 },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts.toLocaleString(),
      change: '+12%',
      positive: true,
      icon: Package,
      href: '/products',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      change: '+8.5%',
      positive: true,
      icon: ShoppingCart,
      href: '/orders',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      change: '+15.2%',
      positive: true,
      icon: Users,
      href: '/customers',
    },
    {
      title: 'Total Revenue',
      value: `₹${(stats.totalRevenue / 100000).toFixed(1)}L`,
      change: '+18.3%',
      positive: true,
      icon: DollarSign,
      href: '/analytics',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">REZ Retail</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-blue-600">Dashboard</Link>
              <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900">Products</Link>
              <Link href="/inventory" className="text-sm font-medium text-gray-600 hover:text-gray-900">Inventory</Link>
              <Link href="/customers" className="text-sm font-medium text-gray-600 hover:text-gray-900">Customers</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <stat.icon className="w-5 h-5 text-blue-600" />
                </div>
                <span
                  className={`flex items-center text-sm font-medium ${
                    stat.positive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.positive ? (
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                  )}
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-500">{stat.title}</p>
            </Link>
          ))}
        </div>

        {/* Alerts Section */}
        {(stats.lowStockAlerts > 0 || stats.pendingOrders > 0) && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.lowStockAlerts > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">
                      {stats.lowStockAlerts} products low on stock
                    </p>
                    <Link href="/inventory" className="text-sm text-amber-600 hover:text-amber-700">
                      View inventory
                    </Link>
                  </div>
                </div>
              )}
              {stats.pendingOrders > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">
                      {stats.pendingOrders} orders pending fulfillment
                    </p>
                    <Link href="/orders" className="text-sm text-blue-600 hover:text-blue-700">
                      View orders
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Weekly Sales Trend</h2>
            <Link href="/analytics" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
              <BarChart3 className="w-4 h-4 mr-1" />
              View Analytics
            </Link>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {salesTrend.map((day) => {
              const maxRevenue = Math.max(...salesTrend.map((d) => d.revenue));
              const height = (day.revenue / maxRevenue) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">₹{(day.revenue / 1000).toFixed(0)}k</span>
                    <div
                      className="w-full bg-blue-500 rounded-t-md transition-all hover:bg-blue-600"
                      style={{ height: `${height}%`, minHeight: '20px' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/products/new"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <Package className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Add New Product</h3>
            <p className="text-sm text-gray-500">Create a new product in your catalog</p>
          </Link>
          <Link
            href="/inventory/reorder"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <TrendingUp className="w-8 h-8 text-green-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Reorder Stock</h3>
            <p className="text-sm text-gray-500">Generate purchase orders for low stock items</p>
          </Link>
          <Link
            href="/customers/new"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <Users className="w-8 h-8 text-purple-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Add Customer</h3>
            <p className="text-sm text-gray-500">Register a new customer in the system</p>
          </Link>
        </div>
      </main>
    </div>
  );
}

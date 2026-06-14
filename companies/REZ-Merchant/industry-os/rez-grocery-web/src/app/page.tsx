'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalProducts: 0, lowStock: 0, activeOrders: 0, totalDeliveries: 0 });

  useEffect(() => {
    setStats({ totalProducts: 1250, lowStock: 15, activeOrders: 45, totalDeliveries: 120 });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Grocery Dashboard</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Products</p><p className="text-2xl font-bold">{stats.totalProducts}</p></div>
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Low Stock</p><p className="text-2xl font-bold text-red-600">{stats.lowStock}</p></div>
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Active Orders</p><p className="text-2xl font-bold">{stats.activeOrders}</p></div>
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Deliveries</p><p className="text-2xl font-bold">{stats.totalDeliveries}</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/products" className="block p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50">Manage Products</a>
              <a href="/orders" className="block p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50">View Orders</a>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b"><span>Order #1234</span><span className="text-green-600">Delivered</span></div>
              <div className="flex justify-between py-2 border-b"><span>Order #1235</span><span className="text-blue-600">In Transit</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

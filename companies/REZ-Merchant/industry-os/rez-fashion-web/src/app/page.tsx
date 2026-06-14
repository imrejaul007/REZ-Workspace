'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalCollections: 0, totalProducts: 0, activeProducts: 0, totalOrders: 0 });

  useEffect(() => {
    setStats({ totalCollections: 8, totalProducts: 245, activeProducts: 198, totalOrders: 56 });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Fashion Dashboard</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Collections</p><p className="text-2xl font-bold">{stats.totalCollections}</p></div>
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Products</p><p className="text-2xl font-bold">{stats.totalProducts}</p></div>
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Active Products</p><p className="text-2xl font-bold">{stats.activeProducts}</p></div>
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Orders</p><p className="text-2xl font-bold">{stats.totalOrders}</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/collections" className="block p-3 rounded-lg border border-gray-200 hover:border-pink-500 hover:bg-pink-50">Manage Collections</a>
              <a href="/products" className="block p-3 rounded-lg border border-gray-200 hover:border-pink-500 hover:bg-pink-50">View Products</a>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Collections</h2>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b"><span>Summer 2024</span><span className="text-pink-600">Active</span></div>
              <div className="flex justify-between py-2 border-b"><span>Winter 2024</span><span className="text-gray-500">Draft</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

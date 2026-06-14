'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalVehicles: 0, todayBookings: 0, revenue: 0, lowStock: 0 });

  useEffect(() => {
    setStats({ totalVehicles: 245, todayBookings: 18, revenue: 85000, lowStock: 5 });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Automotive Dashboard</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Total Vehicles</p><p className="text-2xl font-bold">{stats.totalVehicles}</p></div>
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Today Bookings</p><p className="text-2xl font-bold">{stats.todayBookings}</p></div>
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Revenue</p><p className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</p></div>
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Low Stock Parts</p><p className="text-2xl font-bold">{stats.lowStock}</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/vehicles" className="block p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50">Manage Vehicles</a>
              <a href="/bookings" className="block p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50">View Bookings</a>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b"><span>MH12AB1234</span><span className="text-green-600">Scheduled</span></div>
              <div className="flex justify-between py-2 border-b"><span>MH14CD5678</span><span className="text-blue-600">In Progress</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

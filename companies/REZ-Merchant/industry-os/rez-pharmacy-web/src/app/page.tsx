'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalMedicines: 0, lowStock: 0, prescriptions: 0, expiring: 0 });

  useEffect(() => {
    setStats({ totalMedicines: 450, lowStock: 12, prescriptions: 85, expiring: 8 });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Medicines</p><p className="text-2xl font-bold">{stats.totalMedicines}</p></div>
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Low Stock</p><p className="text-2xl font-bold text-red-600">{stats.lowStock}</p></div>
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Prescriptions</p><p className="text-2xl font-bold">{stats.prescriptions}</p></div>
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Expiring Soon</p><p className="text-2xl font-bold text-orange-600">{stats.expiring}</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/medicines" className="block p-3 rounded-lg border border-gray-200 hover:border-teal-500 hover:bg-teal-50">Manage Medicines</a>
              <a href="/prescriptions" className="block p-3 rounded-lg border border-gray-200 hover:border-teal-500 hover:bg-teal-50">View Prescriptions</a>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Prescriptions</h2>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b"><span>RX-001</span><span className="text-green-600">Verified</span></div>
              <div className="flex justify-between py-2 border-b"><span>RX-002</span><span className="text-blue-600">Pending</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

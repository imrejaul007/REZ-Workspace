'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Warranty } from '@/services/api';

export default function DashboardPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    totalValue: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const mock = getMockWarranties();
    setWarranties(mock);
    setStats({
      total: mock.length,
      active: mock.filter(w => w.status === 'active').length,
      expiringSoon: mock.filter(w => {
        const end = new Date(w.warrantyEndDate);
        const days = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days > 0 && days <= 30;
      }).length,
      totalValue: 245000,
    });
    setLoading(false);
  };

  const getMockWarranties = (): Warranty[] => [
    {
      id: '1',
      qrCode: 'REZ-WARR-2024-001234',
      productName: 'MacBook Pro 14"',
      productCategory: 'Electronics',
      brand: 'Apple',
      serialNumber: 'C02ZW1ZZLVDL',
      purchaseDate: '2024-01-15',
      warrantyStartDate: '2024-01-15',
      warrantyEndDate: '2027-01-14',
      status: 'active',
      owner: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
      claimHistory: [],
      transferHistory: [],
      verificationCount: 5,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-03-20T14:22:00Z',
    },
    {
      id: '2',
      qrCode: 'REZ-WARR-2023-005678',
      productName: 'Sony WH-1000XM5',
      productCategory: 'Audio',
      brand: 'Sony',
      serialNumber: 'SN12345678',
      purchaseDate: '2023-06-20',
      warrantyStartDate: '2023-06-20',
      warrantyEndDate: '2026-06-19',
      status: 'active',
      owner: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
      claimHistory: [],
      transferHistory: [],
      verificationCount: 12,
      createdAt: '2023-06-20T10:30:00Z',
      updatedAt: '2024-03-20T14:22:00Z',
    },
    {
      id: '3',
      qrCode: 'REZ-WARR-2024-002345',
      productName: 'Samsung Galaxy S24 Ultra',
      productCategory: 'Electronics',
      brand: 'Samsung',
      serialNumber: 'R5CR50NGXYZ',
      purchaseDate: '2024-02-10',
      warrantyStartDate: '2024-02-10',
      warrantyEndDate: '2027-02-09',
      status: 'active',
      owner: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
      claimHistory: [],
      transferHistory: [],
      verificationCount: 8,
      createdAt: '2024-02-10T10:30:00Z',
      updatedAt: '2024-03-20T14:22:00Z',
    },
  ];

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getWarrantyProgress = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();
    const total = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const getProgressColor = (remaining: number) => {
    if (remaining > 180) return 'bg-emerald-500';
    if (remaining > 90) return 'bg-teal-500';
    if (remaining > 30) return 'bg-amber-500';
    if (remaining > 0) return 'bg-red-500';
    return 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative grid md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome back, John
            </h1>
            <p className="text-emerald-100 text-lg">
              You have {stats.active} active warranties protecting ₹{stats.totalValue.toLocaleString()} in products
            </p>
          </div>
          <div className="flex items-center justify-center">
            <Link
              href="/scan"
              className="group relative inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 px-6 py-4 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <span className="font-semibold">Scan QR Code</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Products', value: stats.total, icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 7c0 3.308 2.692 6 6 6s6-2.692 6-6c0-1.05-.18-2.05-.5-2.98z', color: 'emerald' },
          { label: 'Active Warranties', value: stats.active, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'teal' },
          { label: 'Expiring Soon', value: stats.expiringSoon, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'amber' },
          { label: 'Total Protected', value: `₹${(stats.totalValue / 1000).toFixed(0)}K`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'cyan' },
        ].map((stat, i) => (
          <div key={i} className={`relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-lg transition-shadow duration-300`}>
            <div className={`absolute top-0 right-0 w-20 h-20 bg-${stat.color}-100 rounded-bl-full opacity-50`} />
            <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center mb-3`}>
              <svg className={`w-5 h-5 text-${stat.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/scan', label: 'Scan QR', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z', color: 'emerald' },
          { href: '/passport', label: 'Passport', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', color: 'blue' },
          { href: '/plans', label: 'Extend', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', color: 'purple' },
          { href: '/resale', label: 'Resale Check', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', color: 'rose' },
        ].map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-${action.color}-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className={`relative w-12 h-12 rounded-xl bg-${action.color}-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <svg className={`w-6 h-6 text-${action.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
              </svg>
            </div>
            <p className="relative font-semibold text-gray-900">{action.label}</p>
          </Link>
        ))}
      </div>

      {/* Products Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Your Products</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{warranties.length} products</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {warranties.map((warranty, i) => {
            const daysRemaining = getDaysRemaining(warranty.warrantyEndDate);
            const progress = getWarrantyProgress(warranty.warrantyStartDate, warranty.warrantyEndDate);
            const progressColor = getProgressColor(daysRemaining);

            return (
              <div
                key={warranty.id}
                className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Brand Color Bar */}
                <div className={`h-1.5 bg-gradient-to-r ${
                  warranty.brand === 'Apple' ? 'from-gray-600 to-gray-900' :
                  warranty.brand === 'Sony' ? 'from-gray-800 to-black' :
                  'from-blue-600 to-blue-800'
                }`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        {warranty.brand}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {warranty.productName}
                      </h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      warranty.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {warranty.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500">Warranty Progress</span>
                      <span className="font-medium text-gray-700">{Math.round(100 - progress)}% left</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progressColor} rounded-full transition-all duration-500`}
                        style={{ width: `${100 - progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired'}
                    </p>
                  </div>

                  {/* Meta Info */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Serial</p>
                      <p className="text-sm font-mono font-medium text-gray-900 truncate">
                        {warranty.serialNumber}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Verifications</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {warranty.verificationCount}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/passport?serial=${warranty.serialNumber}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      View
                    </Link>
                    <button className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </button>
                    <button className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Card */}
          <Link
            href="/scan"
            className="group relative overflow-hidden rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 hover:border-emerald-300 p-5 flex flex-col items-center justify-center min-h-[280px] transition-all duration-300 hover:bg-emerald-50/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700 group-hover:text-emerald-600 transition-colors">
              Scan New Product
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Add a product to your portfolio
            </p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { action: 'Product Verified', product: 'MacBook Pro 14"', time: '2 hours ago', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { action: 'Warranty Activated', product: 'Samsung Galaxy S24', time: '1 day ago', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { action: 'Passport Viewed', product: 'Sony WH-1000XM5', time: '3 days ago', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
          ].map((item, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{item.action}</p>
                <p className="text-sm text-gray-500 truncate">{item.product}</p>
              </div>
              <span className="text-xs text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

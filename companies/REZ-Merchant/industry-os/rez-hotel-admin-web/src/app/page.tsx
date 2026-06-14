/**
 * Hotel Admin Web Panel
 * For: Hotel Manager, Owner
 */

'use client';

import React, { useState } from 'react';

interface HotelMetrics {
  todayRevenue: number;
  occupancy: number;
  avgRating: number;
  pendingRequests: number;
  revPAR: number;
}

interface RecentBooking {
  id: string;
  guest: string;
  room: string;
  checkIn: string;
  status: 'confirmed' | 'checked_in' | 'checked_out';
}

export default function HotelAdminPanel() {
  const [metrics] = useState<HotelMetrics>({
    todayRevenue: 245000,
    occupancy: 78,
    avgRating: 4.5,
    pendingRequests: 12,
    revPAR: 4800
  });

  const [recentBookings] = useState<RecentBooking[]>([
    { id: '1', guest: 'John Doe', room: '101', checkIn: 'Today 2PM', status: 'confirmed' },
    { id: '2', guest: 'Jane Smith', room: '203', checkIn: 'Today 3PM', status: 'confirmed' },
    { id: '3', guest: 'Bob Wilson', room: '305', checkIn: 'Yesterday', status: 'checked_in' },
  ]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Hotel Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, Manager</span>
            <button className="bg-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-600 transition">
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4">
        <MetricCard label="Today's Revenue" value={`₹${(metrics.todayRevenue / 100).toLocaleString()}`} trend="+12%" />
        <MetricCard label="Occupancy" value={`${metrics.occupancy}%`} trend="+5%" />
        <MetricCard label="Avg Rating" value={`${metrics.avgRating}/5`} trend="+0.2" />
        <MetricCard label="Pending Requests" value={metrics.pendingRequests.toString()} trend="-3" />
        <MetricCard label="RevPAR" value={`₹${metrics.revPAR.toLocaleString()}`} trend="+8%" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Bookings</h2>
              <button className="text-blue-600 text-sm hover:underline">View All</button>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Guest</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Room</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Check-in</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{booking.guest}</div>
                      <div className="text-sm text-gray-500">ID: #{booking.id}</div>
                    </td>
                    <td className="p-3 font-medium">Room {booking.room}</td>
                    <td className="p-3 text-gray-600">{booking.checkIn}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'checked_in' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <button className="text-blue-600 hover:text-blue-800 text-sm mr-2">Edit</button>
                      <button className="text-red-600 hover:text-red-800 text-sm">Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3">Room Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Available</span>
                <span className="font-semibold text-green-600">24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Occupied</span>
                <span className="font-semibold text-blue-600">78</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Maintenance</span>
                <span className="font-semibold text-orange-600">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Rooms</span>
                <span className="font-semibold">105</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3">Staff On Duty</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Front Desk</span>
                <span className="font-semibold">4</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Housekeeping</span>
                <span className="font-semibold">6</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Restaurant</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Security</span>
                <span className="font-semibold">2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition flex flex-col items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="font-medium">Add Booking</span>
        </button>
        <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition flex flex-col items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="font-medium">Room Management</span>
        </button>
        <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition flex flex-col items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="font-medium">Housekeeping</span>
        </button>
        <button className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg transition flex flex-col items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-medium">Reports</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-gray-200 text-center p-4 mt-4 text-sm text-gray-600">
        Hotel Admin Panel v1.0 - Powered by ReZ Platform
      </footer>
    </div>
  );
}

function MetricCard({ label, value, trend }: { label: string; value: string; trend?: string }) {
  const isPositive = trend && !trend.startsWith('-');
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {trend && (
        <div className={`text-xs mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend} from yesterday
        </div>
      )}
    </div>
  );
}

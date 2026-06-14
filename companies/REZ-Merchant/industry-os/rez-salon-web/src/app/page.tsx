'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalBookings: number;
  todayBookings: number;
  totalCustomers: number;
  totalRevenue: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    todayBookings: 0,
    totalCustomers: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data - replace with actual API calls
    const fetchStats = async () => {
      try {
        // const response = await fetch('http://localhost:4201/api/bookings/stats');
        // const data = await response.json();
        setStats({
          totalBookings: 156,
          todayBookings: 12,
          totalCustomers: 89,
          totalRevenue: 45680,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">REZ Salon Dashboard</h1>
            <nav className="flex space-x-4">
              <a href="/" className="text-blue-600 font-medium">Dashboard</a>
              <a href="/bookings" className="text-gray-600 hover:text-gray-900">Bookings</a>
              <a href="/customers" className="text-gray-600 hover:text-gray-900">Customers</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon="📅"
            color="blue"
          />
          <StatCard
            title="Today's Bookings"
            value={stats.todayBookings}
            icon="✅"
            color="green"
          />
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon="👥"
            color="purple"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon="💰"
            color="yellow"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              + New Booking
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              + Add Customer
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              + Add Service
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">Priya Sharma</p>
                <p className="text-sm text-gray-500">Hair Coloring - 10:00 AM</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Confirmed</span>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">Anita Patel</p>
                <p className="text-sm text-gray-500">Haircut + Styling - 11:30 AM</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Pending</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Meera Gupta</p>
                <p className="text-sm text-gray-500">Facial Treatment - 2:00 PM</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Confirmed</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <span className={`text-3xl ${colorClasses[color]}`}>{icon}</span>
      </div>
    </div>
  );
}

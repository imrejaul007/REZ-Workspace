'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalServices: number;
  activeTherapists: number;
  todayBookings: number;
  weeklyRevenue: number;
  lowStockItems: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalServices: 0,
    activeTherapists: 0,
    todayBookings: 0,
    weeklyRevenue: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats({
          totalServices: 24,
          activeTherapists: 8,
          todayBookings: 15,
          weeklyRevenue: 125000,
          lowStockItems: 3
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Spa Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Services"
            value={stats.totalServices}
            icon="spa"
            color="purple"
          />
          <StatCard
            title="Active Therapists"
            value={stats.activeTherapists}
            icon="people"
            color="green"
          />
          <StatCard
            title="Today's Bookings"
            value={stats.todayBookings}
            icon="calendar"
            color="blue"
          />
          <StatCard
            title="Weekly Revenue"
            value={`₹${stats.weeklyRevenue.toLocaleString()}`}
            icon="money"
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <QuickAction href="/services" label="Manage Services" icon="spa" />
              <QuickAction href="/bookings" label="View Bookings" icon="calendar" />
              <QuickAction href="/bookings/new" label="New Booking" icon="plus" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Alerts</h2>
            {stats.lowStockItems > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-medium">
                  {stats.lowStockItems} product(s) low on stock
                </p>
                <a href="/inventory" className="text-yellow-600 text-sm hover:underline">
                  View Inventory
                </a>
              </div>
            )}
            {stats.lowStockItems === 0 && (
              <p className="text-gray-500">No alerts at this time</p>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-3 text-gray-600">Customer</th>
                <th className="pb-3 text-gray-600">Service</th>
                <th className="pb-3 text-gray-600">Therapist</th>
                <th className="pb-3 text-gray-600">Time</th>
                <th className="pb-3 text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3">Priya Sharma</td>
                <td className="py-3">Deep Tissue Massage</td>
                <td className="py-3">Anita</td>
                <td className="py-3">10:00 AM</td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Confirmed
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3">Neha Patel</td>
                <td className="py-3">Facial Treatment</td>
                <td className="py-3">Meera</td>
                <td className="py-3">11:30 AM</td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    In Progress
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
          <span className="text-xl">{getIcon(icon)}</span>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, label, icon }: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors"
    >
      <span className="text-xl mr-3">{getIcon(icon)}</span>
      <span className="font-medium text-gray-700">{label}</span>
    </a>
  );
}

function getIcon(name: string): string {
  const icons: Record<string, string> = {
    spa: '🧖',
    people: '👥',
    calendar: '📅',
    money: '💰',
    plus: '➕'
  };
  return icons[name] || '•';
}

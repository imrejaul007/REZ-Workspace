'use client';

import { useState, useEffect } from 'react';

interface GymStats {
  totalMembers: number;
  activeMembers: number;
  totalClasses: number;
  todayCheckIns: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<GymStats>({
    totalMembers: 0,
    activeMembers: 0,
    totalClasses: 0,
    todayCheckIns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data
    setStats({
      totalMembers: 245,
      activeMembers: 198,
      totalClasses: 28,
      todayCheckIns: 52,
    });
    setLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900">REZ Gym Dashboard</h1>
            <nav className="flex space-x-4">
              <a href="/" className="text-blue-600 font-medium">Dashboard</a>
              <a href="/members" className="text-gray-600 hover:text-gray-900">Members</a>
              <a href="/classes" className="text-gray-600 hover:text-gray-900">Classes</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Members" value={stats.totalMembers} icon="👥" color="blue" />
          <StatCard title="Active Members" value={stats.activeMembers} icon="✅" color="green" />
          <StatCard title="Classes" value={stats.totalClasses} icon="🏋️" color="purple" />
          <StatCard title="Today's Check-ins" value={stats.todayCheckIns} icon="📊" color="yellow" />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              + Add Member
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              + Create Class
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              View Attendance
            </button>
          </div>
        </div>

        {/* Today's Classes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Classes</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">Morning Yoga</p>
                <p className="text-sm text-gray-500">7:00 AM - 8:00 AM | 12/15 enrolled</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Active</span>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">HIIT Training</p>
                <p className="text-sm text-gray-500">9:00 AM - 10:00 AM | 18/20 enrolled</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Spinning</p>
                <p className="text-sm text-gray-500">6:00 PM - 7:00 PM | 10/15 enrolled</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Upcoming</span>
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

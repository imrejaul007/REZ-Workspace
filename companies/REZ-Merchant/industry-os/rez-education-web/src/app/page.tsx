'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  activeBatches: number;
  monthlyRevenue: number;
  attendanceRate: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    activeBatches: 0,
    monthlyRevenue: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStats({
      totalCourses: 15,
      totalStudents: 450,
      activeBatches: 25,
      monthlyRevenue: 2500000,
      attendanceRate: 87
    });
    setLoading(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Education Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard title="Courses" value={stats.totalCourses} color="blue" />
          <StatCard title="Students" value={stats.totalStudents} color="green" />
          <StatCard title="Active Batches" value={stats.activeBatches} color="purple" />
          <StatCard title="Monthly Revenue" value={`₹${(stats.monthlyRevenue / 100000).toFixed(1)}L`} color="yellow" />
          <StatCard title="Attendance Rate" value={`${stats.attendanceRate}%`} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <QuickAction href="/courses" label="Manage Courses" />
              <QuickAction href="/students" label="View Students" />
              <QuickAction href="/attendance" label="Mark Attendance" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Enrollments</h2>
            <div className="space-y-3">
              <EnrollmentRow name="Rahul Kumar" course="Web Development" date="Today" />
              <EnrollmentRow name="Priya Singh" course="Data Science" date="Yesterday" />
              <EnrollmentRow name="Amit Sharma" course="Digital Marketing" date="2 days ago" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="block p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
      <span className="font-medium text-gray-700">{label}</span>
    </a>
  );
}

function EnrollmentRow({ name, course, date }: { name: string; course: string; date: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-500">{course}</p>
      </div>
      <span className="text-sm text-gray-400">{date}</span>
    </div>
  );
}

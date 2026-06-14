'use client'

import { useState } from 'react'

// Mock data for stats
const stats = [
  {
    title: 'Total Revenue',
    value: '₹12,45,000',
    change: '+12.5%',
    changeType: 'positive',
    icon: 'Currency',
    color: 'blue',
  },
  {
    title: 'Active Employees',
    value: '248',
    change: '+8 this month',
    changeType: 'positive',
    icon: 'Users',
    color: 'green',
  },
  {
    title: 'Pending Orders',
    value: '156',
    change: '-3 from yesterday',
    changeType: 'negative',
    icon: 'ClipboardList',
    color: 'purple',
  },
  {
    title: 'Growth Rate',
    value: '24.8%',
    change: '+2.1% vs last quarter',
    changeType: 'positive',
    icon: 'TrendingUp',
    color: 'orange',
  },
]

// Mock transaction data
const transactions = [
  { id: 1, user: 'Priya Sharma', email: 'priya.sharma@company.com', amount: '₹45,000', status: 'Completed', date: '2026-06-08' },
  { id: 2, user: 'Rahul Verma', email: 'rahul.v@company.com', amount: '₹32,500', status: 'Pending', date: '2026-06-08' },
  { id: 3, user: 'Anita Desai', email: 'anita.d@company.com', amount: '₹28,000', status: 'Completed', date: '2026-06-07' },
  { id: 4, user: 'Vikram Singh', email: 'vikram.s@company.com', amount: '₹67,500', status: 'Processing', date: '2026-06-07' },
  { id: 5, user: 'Meera Patel', email: 'meera.p@company.com', amount: '₹18,000', status: 'Completed', date: '2026-06-06' },
  { id: 6, user: 'Kiran Nair', email: 'kiran.n@company.com', amount: '₹52,000', status: 'Completed', date: '2026-06-06' },
]

const quickActions = [
  { title: 'Add Employee', description: 'Create new employee profile', icon: 'UserPlus' },
  { title: 'Generate Report', description: 'Create payroll report', icon: 'FileBarChart' },
  { title: 'Schedule Meeting', description: 'Set up team meeting', icon: 'CalendarPlus' },
  { title: 'Send Announcement', description: 'Broadcast to team', icon: 'Megaphone' },
]

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
            <p className="text-sm text-slate-500">Welcome back! Here&apos;s what&apos;s happening today.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              + Add New
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-2 ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  stat.color === 'green' ? 'bg-green-100 text-green-600' :
                  stat.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  <StatIcon name={stat.icon} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transactions Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{transaction.user}</p>
                          <p className="text-xs text-slate-500">{transaction.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{transaction.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{transaction.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <ActionIcon name={action.icon} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900">{action.title}</p>
                    <p className="text-xs text-slate-500">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Chart Placeholder */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-medium text-slate-900 mb-4">Revenue Overview</h4>
              <div className="h-40 bg-slate-100 rounded-lg flex items-end justify-between px-4 pb-2">
                {[40, 65, 45, 80, 55, 70, 85, 60, 75, 90, 70, 95].map((height, i) => (
                  <div
                    key={i}
                    className="w-4 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>Jan</span>
                <span>Dec</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Activity Feed */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { action: 'New employee onboarded', user: 'Sneha Reddy', time: '2 hours ago' },
                { action: 'Payslip generated', user: 'Amit Kumar', time: '4 hours ago' },
                { action: 'Leave approved', user: 'Neha Singh', time: '5 hours ago' },
                { action: 'Performance review', user: 'Raj Malhotra', time: 'Yesterday' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                  <div>
                    <p className="text-sm text-slate-900">{activity.action}</p>
                    <p className="text-xs text-slate-500">{activity.user} - {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Events</h3>
            <div className="space-y-4">
              {[
                { event: 'Team Meeting', date: 'June 10, 2026', type: 'meeting' },
                { event: 'Payroll Processing', date: 'June 15, 2026', type: 'payroll' },
                { event: 'Performance Review', date: 'June 20, 2026', type: 'review' },
                { event: 'Training Session', date: 'June 25, 2026', type: 'training' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    item.type === 'meeting' ? 'bg-blue-100 text-blue-600' :
                    item.type === 'payroll' ? 'bg-green-100 text-green-600' :
                    item.type === 'review' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    <EventIcon type={item.type} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.event}</p>
                    <p className="text-xs text-slate-500">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Stats */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Department Distribution</h3>
            <div className="space-y-4">
              {[
                { dept: 'Engineering', count: 85, percentage: 34 },
                { dept: 'Sales', count: 52, percentage: 21 },
                { dept: 'Marketing', count: 38, percentage: 15 },
                { dept: 'Operations', count: 45, percentage: 18 },
                { dept: 'HR', count: 28, percentage: 12 },
              ].map((dept, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{dept.dept}</span>
                    <span className="text-slate-500">{dept.count} ({dept.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                      style={{ width: `${dept.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Icon Components
function StatIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    Currency: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Users: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    ClipboardList: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    TrendingUp: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  }
  return icons[name] || null
}

function ActionIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    UserPlus: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    FileBarChart: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    CalendarPlus: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    Megaphone: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  }
  return icons[name] || null
}

function EventIcon({ type }: { type: string }) {
  const icons: Record<string, JSX.Element> = {
    meeting: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    payroll: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    review: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    training: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  }
  return icons[type] || null
}
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield, Users, FileCheck, AlertTriangle, TrendingUp, Activity,
  ChevronRight, Plus, Search, Bell, Settings, BarChart3, Network,
  Award, Briefcase, CheckCircle, Clock, XCircle
} from 'lucide-react';
import { mockStats, recentActivity, scoreDistribution, tierColors } from '@/lib/mockData';

export default function DashboardPage() {
  const [stats, setStats] = useState(mockStats);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const statCards = [
    { label: 'Total Identities', value: stats.totalIdentities, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Verified', value: stats.totalVerified, icon: Shield, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Pending', value: stats.pendingVerifications, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Risk Alerts', value: stats.riskAlerts, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3, active: true },
    { href: '/verifications', label: 'Verifications', icon: FileCheck, active: false },
    { href: '/scores', label: 'CI Scores', icon: Award, active: false },
    { href: '/passports', label: 'Passports', icon: Briefcase, active: false },
    { href: '/graph', label: 'Trust Graph', icon: Network, active: false },
    { href: '/partners', label: 'Partners', icon: Users, active: false },
    { href: '/admin', label: 'Admin', icon: Settings, active: false },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f23] flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1a1a2e] border-r border-gray-800 flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold">CorpID</h1>
                <p className="text-xs text-gray-500">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item, idx) => (
              <li key={idx}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Toggle Button */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
          >
            {sidebarOpen ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-[#1a1a2e] border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, Admin</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search identities..."
                  className="pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm w-64"
                />
              </div>
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              {/* Profile */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                  A
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((stat, idx) => (
              <div key={idx} className="bg-[#1a1a2e] rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <Activity className="w-4 h-4 text-gray-600" />
                </div>
                <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Verification Rate */}
              <div className="bg-[#1a1a2e] rounded-xl p-5 border border-gray-800">
                <h2 className="text-lg font-semibold mb-4">Verification Overview</h2>
                <div className="flex items-center gap-8">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" fill="none" stroke="#333" strokeWidth="12" />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="12"
                        strokeDasharray={`${stats.verificationRate * 3.52} 352`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{stats.verificationRate}%</span>
                      <span className="text-xs text-gray-500">Verified</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-800">
                      <span className="text-sm text-gray-400">Average CI Score</span>
                      <span className="font-semibold">{stats.averageCIScore}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-800">
                      <span className="text-sm text-gray-400">Top Score</span>
                      <span className="font-semibold text-yellow-400">{stats.topScore}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-400">Documents Processed</span>
                      <span className="font-semibold">{stats.documentsProcessed.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-[#1a1a2e] rounded-xl p-5 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                  <Link href="/verifications" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentActivity.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          item.type === 'success' ? 'bg-green-500' :
                          item.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{item.action}</p>
                          <p className="text-xs text-gray-500 font-mono">{item.entity}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-[#1a1a2e] rounded-xl p-5 border border-gray-800">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <Link href="/verifications" className="w-full flex items-center gap-3 bg-[#252538] hover:bg-[#303046] p-3 rounded-lg transition-colors text-left">
                    <FileCheck className="w-5 h-5 text-green-400" />
                    <span className="text-sm">Review Verifications</span>
                  </Link>
                  <Link href="/scores" className="w-full flex items-center gap-3 bg-[#252538] hover:bg-[#303046] p-3 rounded-lg transition-colors text-left">
                    <Award className="w-5 h-5 text-blue-400" />
                    <span className="text-sm">View CI Scores</span>
                  </Link>
                  <Link href="/partners" className="w-full flex items-center gap-3 bg-[#252538] hover:bg-[#303046] p-3 rounded-lg transition-colors text-left">
                    <Users className="w-5 h-5 text-purple-400" />
                    <span className="text-sm">Manage Partners</span>
                  </Link>
                  <Link href="/graph" className="w-full flex items-center gap-3 bg-[#252538] hover:bg-[#303046] p-3 rounded-lg transition-colors text-left">
                    <Network className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm">Trust Graph</span>
                  </Link>
                </div>
              </div>

              {/* Score Distribution */}
              <div className="bg-[#1a1a2e] rounded-xl p-5 border border-gray-800">
                <h2 className="text-lg font-semibold mb-4">Score Distribution</h2>
                <div className="space-y-3">
                  {scoreDistribution.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-16">{item.range}</span>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage * 2}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-12 text-right">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top CI Scores */}
              <div className="bg-[#1a1a2e] rounded-xl p-5 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Top CI Scores</h2>
                  <Link href="/scores" className="text-xs text-indigo-400 hover:text-indigo-300">
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {[
                    { corpId: 'CI-IND-AB123', score: 980, tier: 'ELITE' },
                    { corpId: 'CI-BIZ-XY456', score: 945, tier: 'ELITE' },
                    { corpId: 'CI-SUP-ZW789', score: 890, tier: 'PREMIUM' },
                    { corpId: 'CI-MER-UV012', score: 875, tier: 'PREMIUM' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-600">{idx + 1}</span>
                        <div>
                          <p className="text-sm font-mono">{item.corpId}</p>
                          <p className="text-xs" style={{ color: tierColors[item.tier] }}>{item.tier}</p>
                        </div>
                      </div>
                      <span className={`text-lg font-bold ${item.score >= 900 ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {item.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

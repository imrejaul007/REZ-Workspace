'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, Users, FileCheck, BarChart3, Network, Award, Briefcase,
  Settings, Search, Plus, Download, Database, Key, Bell, ShieldCheck,
  AlertTriangle, UserCog, ScrollText, Activity, ChevronRight
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3 },
    { href: '/verifications', label: 'Verifications', icon: FileCheck },
    { href: '/scores', label: 'CI Scores', icon: Award },
    { href: '/passports', label: 'Passports', icon: Briefcase },
    { href: '/graph', label: 'Trust Graph', icon: Network },
    { href: '/partners', label: 'Partners', icon: Users },
    { href: '/admin', label: 'Admin', icon: Settings, active: true },
  ];

  const adminSections = [
    {
      id: 'overview',
      title: 'System Overview',
      icon: Activity,
      description: 'View system health and metrics',
      stats: [
        { label: 'Uptime', value: '99.9%' },
        { label: 'API Calls', value: '2.4M' },
        { label: 'Errors', value: '0.02%' },
        { label: 'Avg Response', value: '45ms' },
      ],
    },
    {
      id: 'users',
      title: 'User Management',
      icon: UserCog,
      description: 'Manage admin users and permissions',
      stats: [
        { label: 'Admins', value: '12' },
        { label: 'Editors', value: '45' },
        { label: 'Viewers', value: '128' },
      ],
    },
    {
      id: 'api',
      title: 'API Keys',
      icon: Key,
      description: 'Manage API keys and integrations',
      stats: [
        { label: 'Active Keys', value: '24' },
        { label: 'Rate Limited', value: '3' },
      ],
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      icon: ScrollText,
      description: 'View system activity logs',
      stats: [
        { label: 'Today', value: '1,245' },
        { label: 'This Week', value: '8,923' },
      ],
    },
    {
      id: 'security',
      title: 'Security',
      icon: ShieldCheck,
      description: 'Security settings and alerts',
      stats: [
        { label: 'Threats Blocked', value: '156' },
        { label: 'Failed Logins', value: '23' },
      ],
    },
    {
      id: 'integrations',
      title: 'Integrations',
      icon: Database,
      description: 'Manage external service connections',
      stats: [
        { label: 'Active', value: '8' },
        { label: 'Inactive', value: '2' },
      ],
    },
  ];

  const recentAuditLogs = [
    { action: 'User login', user: 'admin@corpid.io', time: '2 min ago', status: 'success' },
    { action: 'Verification approved', user: 'reviewer@corpid.io', time: '5 min ago', status: 'success' },
    { action: 'API key created', user: 'admin@corpid.io', time: '10 min ago', status: 'success' },
    { action: 'Permission changed', user: 'admin@corpid.io', time: '15 min ago', status: 'warning' },
    { action: 'Failed login attempt', user: 'unknown', time: '20 min ago', status: 'error' },
  ];

  const systemAlerts = [
    { type: 'warning', message: 'High API usage detected in the last hour' },
    { type: 'info', message: 'Scheduled maintenance on June 1st, 2026' },
    { type: 'success', message: 'Database backup completed successfully' },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f23] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a2e] border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">CorpID</h1>
              <p className="text-xs text-gray-500">Admin Portal</p>
            </div>
          </Link>
        </div>
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
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-[#1a1a2e] border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-sm text-gray-500">System administration and configuration</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm">
                <Download className="w-4 h-4" />
                Export Logs
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm">
                <Plus className="w-4 h-4" />
                Add Admin User
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {/* Admin Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {adminSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`bg-[#1a1a2e] rounded-xl p-5 border text-left transition-all ${
                  activeTab === section.id
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{section.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{section.description}</p>
                <div className="flex items-center gap-4">
                  {section.stats.map((stat, idx) => (
                    <div key={idx}>
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Main Admin Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Audit Logs */}
            <div className="lg:col-span-2">
              <div className="bg-[#1a1a2e] rounded-xl p-5 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Recent Audit Logs</h2>
                  <button className="text-sm text-indigo-400 hover:text-indigo-300">View All</button>
                </div>
                <div className="space-y-3">
                  {recentAuditLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          log.status === 'success' ? 'bg-green-500' :
                          log.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-xs text-gray-500">{log.user}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - System Alerts */}
            <div className="space-y-6">
              {/* Alerts */}
              <div className="bg-[#1a1a2e] rounded-xl p-5 border border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-lg font-semibold">System Alerts</h2>
                </div>
                <div className="space-y-3">
                  {systemAlerts.map((alert, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${
                      alert.type === 'warning' ? 'bg-yellow-500/10' :
                      alert.type === 'success' ? 'bg-green-500/10' : 'bg-blue-500/10'
                    }`}>
                      <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                        alert.type === 'warning' ? 'text-yellow-400' :
                        alert.type === 'success' ? 'text-green-400' : 'text-blue-400'
                      }`} />
                      <p className="text-sm">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Settings */}
              <div className="bg-[#1a1a2e] rounded-xl p-5 border border-gray-800">
                <h2 className="text-lg font-semibold mb-4">Quick Settings</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Maintenance Mode', enabled: false },
                    { label: 'New Registrations', enabled: true },
                    { label: 'Verification Auto-Approve', enabled: false },
                    { label: 'API Rate Limiting', enabled: true },
                  ].map((setting, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <span className="text-sm">{setting.label}</span>
                      <button className={`w-11 h-6 rounded-full transition-colors ${
                        setting.enabled ? 'bg-indigo-600' : 'bg-gray-700'
                      }`}>
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          setting.enabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
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

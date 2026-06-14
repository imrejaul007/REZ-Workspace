'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, Users, FileCheck, BarChart3, Network, Award, Briefcase,
  Settings, Search, ChevronRight, CheckCircle, Clock, Plus
} from 'lucide-react';
import { mockPassports } from '@/lib/mockData';

export default function PassportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'partial'>('all');

  const filteredPassports = mockPassports.filter(p => {
    if (searchQuery && !p.corpId.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (verificationFilter === 'verified' && p.entries !== p.verified) return false;
    if (verificationFilter === 'partial' && p.entries === p.verified) return false;
    return true;
  });

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3 },
    { href: '/verifications', label: 'Verifications', icon: FileCheck },
    { href: '/scores', label: 'CI Scores', icon: Award },
    { href: '/passports', label: 'Passports', icon: Briefcase, active: true },
    { href: '/graph', label: 'Trust Graph', icon: Network },
    { href: '/partners', label: 'Partners', icon: Users },
    { href: '/admin', label: 'Admin', icon: Settings },
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
              <h1 className="text-2xl font-bold">Career Passports</h1>
              <p className="text-sm text-gray-500">Manage professional credentials and verifications</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm">
              <Plus className="w-4 h-4" />
              Create Passport
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Passports', value: mockPassports.length, color: 'text-blue-400' },
              { label: 'Fully Verified', value: mockPassports.filter(p => p.entries === p.verified).length, color: 'text-green-400' },
              { label: 'Partially Verified', value: mockPassports.filter(p => p.entries !== p.verified).length, color: 'text-yellow-400' },
              { label: 'Total Entries', value: mockPassports.reduce((acc, p) => acc + p.entries, 0), color: 'text-purple-400' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by CorpID or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-64"
                />
              </div>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value as typeof verificationFilter)}
                className="px-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All</option>
                <option value="verified">Fully Verified</option>
                <option value="partial">Partially Verified</option>
              </select>
            </div>
          </div>

          {/* Passports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPassports.map((passport) => (
              <div key={passport.id} className="bg-[#1a1a2e] rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-mono text-sm text-indigo-400">{passport.corpId}</p>
                    <h3 className="text-lg font-semibold mt-1">{passport.name}</h3>
                  </div>
                  {passport.entries === passport.verified ? (
                    <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg text-xs">
                      <Clock className="w-3 h-3" />
                      Partial
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Entries</p>
                    <p className="text-lg font-bold">{passport.entries}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Verified</p>
                    <p className="text-lg font-bold text-green-400">{passport.verified}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Progress</p>
                    <p className="text-lg font-bold">
                      {Math.round((passport.verified / passport.entries) * 100)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Updated {new Date(passport.lastUpdated).toLocaleDateString()}
                  </span>
                  <button className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300">
                    View <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

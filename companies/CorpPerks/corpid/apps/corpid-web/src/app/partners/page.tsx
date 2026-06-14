'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, Users, FileCheck, BarChart3, Network, Award, Briefcase,
  Settings, Search, Plus, CheckCircle, Clock, Building2, GraduationCap, BriefcaseIcon, MoreVertical
} from 'lucide-react';
import { mockPartners } from '@/lib/mockData';

export default function PartnersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPartners = mockPartners.filter(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'employer': return <BriefcaseIcon className="w-5 h-5 text-green-400" />;
      case 'institution': return <GraduationCap className="w-5 h-5 text-yellow-400" />;
      default: return <Building2 className="w-5 h-5 text-blue-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      inactive: 'bg-gray-500/20 text-gray-400',
    };
    return `px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-500/20 text-gray-400'}`;
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3 },
    { href: '/verifications', label: 'Verifications', icon: FileCheck },
    { href: '/scores', label: 'CI Scores', icon: Award },
    { href: '/passports', label: 'Passports', icon: Briefcase },
    { href: '/graph', label: 'Trust Graph', icon: Network },
    { href: '/partners', label: 'Partners', icon: Users, active: true },
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
              <h1 className="text-2xl font-bold">Partners</h1>
              <p className="text-sm text-gray-500">Manage employer and institution partners</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm">
              <Plus className="w-4 h-4" />
              Add Partner
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Partners', value: mockPartners.length, color: 'text-blue-400' },
              { label: 'Active', value: mockPartners.filter(p => p.status === 'active').length, color: 'text-green-400' },
              { label: 'Pending', value: mockPartners.filter(p => p.status === 'pending').length, color: 'text-yellow-400' },
              { label: 'Avg. Verification', value: '87%', color: 'text-purple-400' },
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
                  placeholder="Search partners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-64"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="employer">Employer</option>
                <option value="institution">Institution</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Partners Table */}
          <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Partner</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Members</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Verification</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartners.map((partner) => (
                  <tr key={partner.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                          {getTypeIcon(partner.type)}
                        </div>
                        <span className="font-medium">{partner.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm capitalize">{partner.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">
                        {partner.type === 'employer'
                          ? partner.employees?.toLocaleString()
                          : partner.students?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden max-w-20">
                          <div
                            className={`h-full ${
                              partner.verificationRate >= 90 ? 'bg-green-500' :
                              partner.verificationRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${partner.verificationRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">{partner.verificationRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(partner.status)}>
                        {partner.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">
                        {new Date(partner.joinedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

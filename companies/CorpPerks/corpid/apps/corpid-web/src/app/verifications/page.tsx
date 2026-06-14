'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, Users, FileCheck, AlertTriangle, BarChart3, Network,
  Award, Briefcase, Settings, Search, Filter, CheckCircle, Clock, XCircle,
  ChevronLeft, ChevronRight, Download, Eye, Check, X
} from 'lucide-react';
import { mockVerifications, verificationTypeLabels } from '@/lib/mockData';

export default function VerificationsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredVerifications = mockVerifications.filter(v => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (typeFilter !== 'all' && v.type !== typeFilter) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      rejected: 'bg-red-500/20 text-red-400',
    };
    return `px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-500/20 text-gray-400'}`;
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3 },
    { href: '/verifications', label: 'Verifications', icon: FileCheck, active: true },
    { href: '/scores', label: 'CI Scores', icon: Award },
    { href: '/passports', label: 'Passports', icon: Briefcase },
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
              <h1 className="text-2xl font-bold">Verifications</h1>
              <p className="text-sm text-gray-500">Manage identity verification requests</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm">
                <FileCheck className="w-4 h-4" />
                New Request
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="identity">Identity</option>
                <option value="employment">Employment</option>
                <option value="education">Education</option>
                <option value="skills">Skills</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by CorpID or name..."
                className="pl-10 pr-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">CorpID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Submitted</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVerifications.map((verification) => (
                  <tr key={verification.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-indigo-400">{verification.corpId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{verification.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">{verificationTypeLabels[verification.type] || verification.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(verification.status)}
                        <span className={getStatusBadge(verification.status)}>
                          {verification.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">
                        {new Date(verification.submittedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                        {verification.status === 'pending' && (
                          <>
                            <button className="p-2 hover:bg-green-500/20 rounded-lg transition-colors">
                              <Check className="w-4 h-4 text-green-400" />
                            </button>
                            <button className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500">Showing {filteredVerifications.length} of {mockVerifications.length} verifications</span>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-[#1a1a2e] border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="px-4 py-2 bg-indigo-600 rounded-lg text-sm">1</button>
              <button className="px-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm hover:bg-gray-800 transition-colors">2</button>
              <button className="px-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm hover:bg-gray-800 transition-colors">3</button>
              <button className="p-2 bg-[#1a1a2e] border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

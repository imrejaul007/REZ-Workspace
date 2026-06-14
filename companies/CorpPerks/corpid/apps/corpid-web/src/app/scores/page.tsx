'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, Users, FileCheck, AlertTriangle, BarChart3, Network,
  Award, Briefcase, Settings, Search, TrendingUp, TrendingDown, Minus,
  ChevronDown, Filter
} from 'lucide-react';
import { mockCIScores, scoreDistribution, tierColors } from '@/lib/mockData';

export default function ScoresPage() {
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScores = mockCIScores.filter(s => {
    if (tierFilter !== 'all' && s.tier !== tierFilter) return false;
    if (searchQuery && !s.corpId.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => sortBy === 'score' ? b.score - a.score : a.name.localeCompare(b.name));

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3 },
    { href: '/verifications', label: 'Verifications', icon: FileCheck },
    { href: '/scores', label: 'CI Scores', icon: Award, active: true },
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
              <h1 className="text-2xl font-bold">CI Scores</h1>
              <p className="text-sm text-gray-500">Manage Composite Identity Scores</p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {/* Score Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Distribution */}
            <div className="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-5 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Score Distribution</h2>
              <div className="space-y-4">
                {scoreDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 w-20">{item.range}</span>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-800 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${item.percentage * 3}%` }}
                        >
                          <span className="text-xs font-medium">{item.count.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 w-16 text-right">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier Summary */}
            <div className="bg-[#1a1a2e] rounded-xl p-5 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">By Tier</h2>
              <div className="space-y-4">
                {['ELITE', 'PREMIUM', 'VERIFIED', 'BASIC', 'UNVERIFIED'].map((tier) => {
                  const tierData = mockCIScores.filter(s => s.tier === tier);
                  const count = tierData.length;
                  return (
                    <div key={tier} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tierColors[tier] }}
                        />
                        <span className="text-sm font-medium">{tier}</span>
                      </div>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
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
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Tiers</option>
                <option value="ELITE">ELITE</option>
                <option value="PREMIUM">PREMIUM</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="BASIC">BASIC</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="score">Sort by Score</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>

          {/* Scores Table */}
          <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">CorpID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Tier</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Score</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Trend</th>
                </tr>
              </thead>
              <tbody>
                {filteredScores.map((score, idx) => (
                  <tr key={score.corpId} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-gray-600">#{idx + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-indigo-400">{score.corpId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{score.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${tierColors[score.tier]}20`,
                          color: tierColors[score.tier]
                        }}
                      >
                        {score.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-lg font-bold ${
                        score.score >= 900 ? 'text-yellow-400' :
                        score.score >= 750 ? 'text-gray-400' : 'text-gray-300'
                      }`}>
                        {score.score}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(score.trend)}
                        {score.trendValue > 0 && <span className="text-green-400 text-sm">+{score.trendValue}</span>}
                        {score.trendValue < 0 && <span className="text-red-400 text-sm">{score.trendValue}</span>}
                        {score.trendValue === 0 && <span className="text-gray-500 text-sm">0</span>}
                      </div>
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

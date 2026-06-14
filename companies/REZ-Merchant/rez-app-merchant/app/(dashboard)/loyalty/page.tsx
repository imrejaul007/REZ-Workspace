'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

// Mock data for demonstration
const MOCK_STATS = {
  totalMembers: 1247,
  activeMembers: 892,
  avgVisitsPerMonth: 3.2,
  loyaltyRevenue: 456780,
  topTierCounts: {
    platinum: 45,
    gold: 123,
    silver: 412,
    bronze: 667,
  },
};

const MOCK_TOP_CUSTOMERS = [
  {
    id: '1',
    name: 'Rahul Sharma',
    phone: '9876543210',
    tier: 'platinum',
    totalVisits: 78,
    totalSpent: 45600,
    currentStreak: 45,
    lastVisit: '2024-03-15',
  },
  {
    id: '2',
    name: 'Priya Patel',
    phone: '9876543211',
    tier: 'gold',
    totalVisits: 35,
    totalSpent: 28900,
    currentStreak: 12,
    lastVisit: '2024-03-14',
  },
  {
    id: '3',
    name: 'Amit Kumar',
    phone: '9876543212',
    tier: 'gold',
    totalVisits: 28,
    totalSpent: 22100,
    currentStreak: 8,
    lastVisit: '2024-03-13',
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    phone: '9876543213',
    tier: 'silver',
    totalVisits: 18,
    totalSpent: 15400,
    currentStreak: 5,
    lastVisit: '2024-03-12',
  },
  {
    id: '5',
    name: 'Vikram Singh',
    phone: '9876543214',
    tier: 'silver',
    totalVisits: 15,
    totalSpent: 12800,
    currentStreak: 3,
    lastVisit: '2024-03-11',
  },
];

const MOCK_RECENT_UNLOCKS = [
  {
    id: '1',
    customerName: 'Priya Patel',
    milestone: 'Loyal',
    unlockedAt: '2024-03-15T10:30:00Z',
    reward: '500 coins',
  },
  {
    id: '2',
    customerName: 'Rahul Sharma',
    milestone: 'VIP',
    unlockedAt: '2024-03-14T14:20:00Z',
    reward: '1500 coins + 10% discount',
  },
  {
    id: '3',
    customerName: 'Amit Kumar',
    milestone: 'Regular',
    unlockedAt: '2024-03-13T09:15:00Z',
    reward: '200 coins',
  },
];

const MOCK_AT_RISK_CUSTOMERS = [
  {
    id: '1',
    name: 'Neha Gupta',
    phone: '9876543215',
    tier: 'gold',
    currentStreak: 14,
    daysSinceVisit: 3,
    lastVisit: '2024-03-10',
    avgOrderValue: 850,
  },
  {
    id: '2',
    name: 'Arun Joshi',
    phone: '9876543216',
    tier: 'silver',
    currentStreak: 7,
    daysSinceVisit: 2,
    lastVisit: '2024-03-11',
    avgOrderValue: 620,
  },
];

type TabType = 'overview' | 'customers' | 'milestones' | 'settings';

export default function LoyaltyDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'platinum':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'gold':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'silver':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-amber-100 text-amber-700 border-amber-300';
    }
  };

  const getTierIcon = (tier: string): string => {
    switch (tier) {
      case 'platinum':
        return '💎';
      case 'gold':
        return '🥇';
      case 'silver':
        return '🥈';
      default:
        return '🥉';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your customer loyalty rewards and engagement
          </p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          View Settings
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {(['overview', 'customers', 'milestones', 'settings'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'py-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize',
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Total Members</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {MOCK_STATS.totalMembers.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">+12% from last month</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Active Members</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {MOCK_STATS.activeMembers.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">71.5% engagement rate</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Avg. Visits/Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {MOCK_STATS.avgVisitsPerMonth}
              </p>
              <p className="text-xs text-green-600 mt-1">+0.3 from last month</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Loyalty Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(MOCK_STATS.loyaltyRevenue)}
              </p>
              <p className="text-xs text-green-600 mt-1">23% of total revenue</p>
            </div>
          </div>

          {/* Tier Distribution */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tier Distribution</h2>
            <div className="flex items-center gap-8">
              {Object.entries(MOCK_STATS.topTierCounts).map(([tier, count]) => (
                <div key={tier} className="text-center">
                  <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2', getTierColor(tier))}>
                    {getTierIcon(tier)}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mt-2 capitalize">{tier}</p>
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">
                    {((count / MOCK_STATS.totalMembers) * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Top Customers */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Top Customers</h2>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {MOCK_TOP_CUSTOMERS.slice(0, 5).map((customer, index) => (
                  <div
                    key={customer.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500">
                        {customer.totalVisits} visits • {formatCurrency(customer.totalSpent)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{getTierIcon(customer.tier)}</span>
                      <span className="text-xs font-medium text-gray-600 capitalize">
                        {customer.tier}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Milestone Unlocks */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Unlocks</h2>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {MOCK_RECENT_UNLOCKS.map((unlock) => (
                  <div
                    key={unlock.id}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                  >
                    <span className="text-2xl">🎉</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {unlock.customerName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Unlocked <strong>{unlock.milestone}</strong> • {unlock.reward}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(unlock.unlockedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* At Risk Customers */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <h2 className="text-lg font-semibold text-gray-900">At-Risk Customers</h2>
              </div>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Send Reminder
              </button>
            </div>
            <div className="space-y-3">
              {MOCK_AT_RISK_CUSTOMERS.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg border border-orange-100"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.phone}</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-lg font-bold text-orange-600">{customer.currentStreak}</p>
                    <p className="text-xs text-gray-500">day streak</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-lg font-bold text-red-600">{customer.daysSinceVisit}</p>
                    <p className="text-xs text-gray-500">days since visit</p>
                  </div>
                  <button className="px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors">
                    Send Offer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">All Customers</h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search customers..."
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <select className="px-3 py-2 border rounded-lg text-sm">
                <option>All Tiers</option>
                <option>Platinum</option>
                <option>Gold</option>
                <option>Silver</option>
                <option>Bronze</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Tier</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Visits</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Total Spent</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Streak</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Last Visit</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_TOP_CUSTOMERS.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border', getTierColor(customer.tier))}>
                        {getTierIcon(customer.tier)}
                        <span className="capitalize">{customer.tier}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{customer.totalVisits}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{formatCurrency(customer.totalSpent)}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-orange-600 font-medium">🔥 {customer.currentStreak}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{customer.lastVisit}</td>
                    <td className="py-3 px-4">
                      <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Milestone Configuration</h2>
          <div className="space-y-4">
            {[
              { name: 'First Order', target: 1, reward: '50 coins' },
              { name: 'Regular', target: 5, reward: '200 coins' },
              { name: 'Loyal', target: 10, reward: '500 coins + 5% discount' },
              { name: 'VIP', target: 25, reward: '1500 coins + 10% discount' },
              { name: 'Elite', target: 50, reward: '3000 coins + 15% discount' },
            ].map((milestone, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{milestone.name}</p>
                  <p className="text-sm text-gray-500">Target: {milestone.target} visits</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-amber-600">{milestone.reward}</p>
                  <button className="text-xs text-indigo-600 hover:text-indigo-700">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Loyalty Program Settings</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between py-4 border-b">
              <div>
                <p className="font-medium text-gray-900">Enable Loyalty Program</p>
                <p className="text-sm text-gray-500">Turn the loyalty program on or off for your store</p>
              </div>
              <button className="relative w-12 h-6 bg-indigo-600 rounded-full">
                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
            <div className="flex items-center justify-between py-4 border-b">
              <div>
                <p className="font-medium text-gray-900">Points per Rs. 10 spent</p>
                <p className="text-sm text-gray-500">Number of points earned per Rs. 10 order</p>
              </div>
              <input
                type="number"
                defaultValue={1}
                className="w-20 px-3 py-2 border rounded-lg text-center"
              />
            </div>
            <div className="flex items-center justify-between py-4 border-b">
              <div>
                <p className="font-medium text-gray-900">Coins per Rs. 50 spent</p>
                <p className="text-sm text-gray-500">Number of coins earned per Rs. 50 order</p>
              </div>
              <input
                type="number"
                defaultValue={1}
                className="w-20 px-3 py-2 border rounded-lg text-center"
              />
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-gray-900">Streak Protection</p>
                <p className="text-sm text-gray-500">Grace period for streak maintenance</p>
              </div>
              <select className="px-3 py-2 border rounded-lg">
                <option>1 day</option>
                <option>2 days</option>
                <option>3 days</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

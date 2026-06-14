'use client';

import { useState, useEffect } from 'react';
import {
  getMerchantStats,
  getMerchantCampaigns,
  getMerchantReferrals,
  createCampaign,
  type MerchantStats,
  type MerchantCampaign,
  type MerchantReferral,
} from '@/lib/api';
import { TrendingUp, Users, DollarSign, Target, Plus, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function MerchantPortal() {
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [campaigns, setCampaigns] = useState<MerchantCampaign[]>([]);
  const [referrals, setReferrals] = useState<MerchantReferral[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'referrals'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [statsRes, campaignsRes, referralsRes] = await Promise.all([
        getMerchantStats().catch(() => null),
        getMerchantCampaigns().catch(() => ({ campaigns: [] })),
        getMerchantReferrals().catch(() => ({ referrals: [] })),
      ]);
      setStats(statsRes);
      setCampaigns(campaignsRes.campaigns);
      setReferrals(referralsRes.referrals);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const formatCurrency = (amount: number) => `₹${(amount / 100).toLocaleString('en-IN')}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN');

  const getCampaignStatus = (campaign: MerchantCampaign) => {
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = campaign.endDate ? new Date(campaign.endDate) : null;

    if (!campaign.isActive) return { label: 'Paused', color: 'gray' };
    if (now < start) return { label: 'Scheduled', color: 'blue' };
    if (end && now > end) return { label: 'Ended', color: 'gray' };
    return { label: 'Active', color: 'green' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-white">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Referral Campaigns</h1>
                <p className="text-xs text-gray-500">Merchant Portal</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">Total Referrals</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalReferrals || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Conversion Rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.conversionRate?.toFixed(1) || 0}%</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-500">Rewards Given</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats?.lifetimeEarnings || 0)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500">Active Campaigns</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{campaigns.filter(c => c.isActive).length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {(['overview', 'campaigns', 'referrals'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? 'border-b-2 border-secondary text-secondary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Campaigns */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Active Campaigns</h2>
                <button onClick={() => setActiveTab('campaigns')} className="text-sm text-secondary hover:underline">
                  View All
                </button>
              </div>
              {campaigns.filter(c => c.isActive).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active campaigns</p>
              ) : (
                <div className="space-y-4">
                  {campaigns.filter(c => c.isActive).slice(0, 3).map((campaign) => (
                    <div key={campaign.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget || 0)}
                          </p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Active
                        </span>
                      </div>
                      {campaign.budget && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-secondary h-2 rounded-full"
                              style={{ width: `${Math.min(100, (campaign.spent / campaign.budget) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Referrers */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Top Referrers</h2>
                <button onClick={() => setActiveTab('referrals')} className="text-sm text-secondary hover:underline">
                  View All
                </button>
              </div>
              {referrals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No referrals yet</p>
              ) : (
                <div className="space-y-3">
                  {referrals.slice(0, 5).map((referral, index) => (
                    <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{
                          index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`
                        }</span>
                        <div>
                          <p className="font-medium text-gray-900">Referrer #{referral.referrerId.slice(-6)}</p>
                          <p className="text-xs text-gray-500">{formatDate(referral.createdAt)}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-secondary">{referral.rewardAmount} coins</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Campaigns</h2>
            </div>
            {campaigns.length === 0 ? (
              <div className="p-12 text-center">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No campaigns yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
                >
                  Create Your First Campaign
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {campaigns.map((campaign) => {
                  const status = getCampaignStatus(campaign);
                  return (
                    <div key={campaign.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          status.color === 'green' ? 'bg-green-100 text-green-700' :
                          status.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500">Referrer Reward</p>
                          <p className="font-medium">
                            {campaign.referrerReward.type === 'fixed' ? `₹${campaign.referrerReward.value}` :
                             campaign.referrerReward.type === 'percentage' ? `${campaign.referrerReward.value}%` :
                             `${campaign.referrerReward.value} coins`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Referee Reward</p>
                          <p className="font-medium">
                            {campaign.refereeReward?.type === 'fixed' ? `₹${campaign.refereeReward.value}` :
                             campaign.refereeReward?.type === 'percentage' ? `${campaign.refereeReward?.value}%` :
                             `${campaign.refereeReward?.value || 0} coins`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Spent</p>
                          <p className="font-medium">{formatCurrency(campaign.spent)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-medium">
                            {formatDate(campaign.startDate)} - {campaign.endDate ? formatDate(campaign.endDate) : 'Ongoing'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Referrals</h2>
            </div>
            {referrals.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No referrals yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Referrer</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Referee</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Reward</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {referrals.map((referral) => (
                      <tr key={referral.id}>
                        <td className="py-4 px-6 text-sm text-gray-900">{referral.referrerId.slice(-8)}...</td>
                        <td className="py-4 px-6 text-sm text-gray-900">{referral.refereeId.slice(-8)}...</td>
                        <td className="py-4 px-6">
                          <span className={`text-xs px-2 py-1 rounded ${
                            referral.status === 'rewarded' ? 'bg-green-100 text-green-700' :
                            referral.status === 'qualified' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {referral.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-secondary">{referral.rewardAmount} coins</td>
                        <td className="py-4 px-6 text-sm text-gray-500">{formatDate(referral.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Campaign</h2>
            </div>
            <form className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="e.g., Summer Referral Special"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  rows={3}
                  placeholder="Describe your campaign..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referrer Reward</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reward Type</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent">
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="coins">Coins</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="10000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-emerald-600 transition"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

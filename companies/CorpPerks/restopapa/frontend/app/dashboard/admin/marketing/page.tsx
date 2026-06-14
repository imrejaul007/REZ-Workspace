'use client'

import { useState } from 'react'
import {
  PlusIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ChartBarIcon,
  GiftIcon,
  MegaphoneIcon,
  TrophyIcon,
  CalendarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Campaign {
  id: string
  name: string
  type: 'discount' | 'credit_bonus' | 'featured_listing' | 'notification' | 'banner' | 'referral'
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled'
  budget: number
  spent: number
  startDate: string
  endDate: string
  targetAudience: string[]
  description: string
  metrics: {
    impressions: number
    clicks: number
    conversions: number
    ctr: number
    conversionRate: number
  }
  settings: {
    discountPercent?: number
    creditAmount?: number
    maxUsers?: number
    minOrderValue?: number
    locations?: string[]
    userTypes?: string[]
  }
}

const mockCampaigns: Campaign[] = [
  {
    id: 'CAMP-001',
    name: 'New Year Special - 20% Off',
    type: 'discount',
    status: 'active',
    budget: 50000,
    spent: 32000,
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    targetAudience: ['restaurants', 'new_users'],
    description: 'New Year promotion offering 20% discount on premium subscriptions',
    metrics: {
      impressions: 15420,
      clicks: 1234,
      conversions: 123,
      ctr: 8.0,
      conversionRate: 10.0
    },
    settings: {
      discountPercent: 20,
      maxUsers: 500,
      minOrderValue: 1000,
      userTypes: ['restaurant']
    }
  },
  {
    id: 'CAMP-002',
    name: 'Employee Referral Bonus',
    type: 'credit_bonus',
    status: 'active',
    budget: 25000,
    spent: 15600,
    startDate: '2025-01-15',
    endDate: '2025-02-15',
    targetAudience: ['employees'],
    description: 'Bonus credits for successful employee referrals',
    metrics: {
      impressions: 8920,
      clicks: 567,
      conversions: 89,
      ctr: 6.4,
      conversionRate: 15.7
    },
    settings: {
      creditAmount: 500,
      maxUsers: 200
    }
  },
  {
    id: 'CAMP-003',
    name: 'Featured Restaurant Listings',
    type: 'featured_listing',
    status: 'scheduled',
    budget: 30000,
    spent: 0,
    startDate: '2025-02-01',
    endDate: '2025-02-28',
    targetAudience: ['restaurants'],
    description: 'Promote top restaurants on homepage for better visibility',
    metrics: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      conversionRate: 0
    },
    settings: {
      maxUsers: 20,
      locations: ['Mumbai', 'Delhi', 'Bangalore']
    }
  },
  {
    id: 'CAMP-004',
    name: 'Festival Notification Blast',
    type: 'notification',
    status: 'completed',
    budget: 5000,
    spent: 4800,
    startDate: '2024-12-20',
    endDate: '2024-12-31',
    targetAudience: ['all_users'],
    description: 'Festival greetings and special offers notification',
    metrics: {
      impressions: 25680,
      clicks: 2045,
      conversions: 234,
      ctr: 8.0,
      conversionRate: 11.4
    },
    settings: {
      maxUsers: 10000
    }
  }
]

export default function MarketingCampaigns() {
  const [campaigns, setCampaigns] = useState(mockCampaigns)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('campaigns')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discount': return TagIcon
      case 'credit_bonus': return GiftIcon
      case 'featured_listing': return TrophyIcon
      case 'notification': return MegaphoneIcon
      case 'banner': return ChartBarIcon
      case 'referral': return UserGroupIcon
      default: return ChartBarIcon
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleCampaignAction = (campaignId: string, action: 'play' | 'pause' | 'stop') => {
    setCampaigns(prev => prev.map(campaign => {
      if (campaign.id === campaignId) {
        let newStatus = campaign.status
        switch (action) {
          case 'play':
            newStatus = campaign.status === 'scheduled' ? 'active' : campaign.status === 'paused' ? 'active' : campaign.status
            break
          case 'pause':
            newStatus = campaign.status === 'active' ? 'paused' : campaign.status
            break
          case 'stop':
            newStatus = 'completed'
            break
        }
        return { ...campaign, status: newStatus }
      }
      return campaign
    }))
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter
    return matchesStatus && matchesType
  })

  const totalMetrics = campaigns.reduce((acc, campaign) => {
    acc.budget += campaign.budget
    acc.spent += campaign.spent
    acc.impressions += campaign.metrics.impressions
    acc.clicks += campaign.metrics.clicks
    acc.conversions += campaign.metrics.conversions
    return acc
  }, { budget: 0, spent: 0, impressions: 0, clicks: 0, conversions: 0 })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing & Growth</h1>
            <p className="text-gray-600 mt-2">Manage campaigns, promotions, and growth initiatives</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Campaign</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'campaigns', name: 'Campaigns', icon: MegaphoneIcon },
              { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
              { id: 'audiences', name: 'Audiences', icon: UserGroupIcon },
              { id: 'templates', name: 'Templates', icon: TagIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CurrencyRupeeIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Budget</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMetrics.budget)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ArrowTrendingUpIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMetrics.spent)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <EyeIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Impressions</p>
                    <p className="text-2xl font-bold text-gray-900">{totalMetrics.impressions.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrophyIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Conversions</p>
                    <p className="text-2xl font-bold text-gray-900">{totalMetrics.conversions}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="discount">Discount</option>
                    <option value="credit_bonus">Credit Bonus</option>
                    <option value="featured_listing">Featured Listing</option>
                    <option value="notification">Notification</option>
                    <option value="banner">Banner</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>All Time</option>
                    <option>This Month</option>
                    <option>Last 30 Days</option>
                    <option>This Quarter</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Campaigns List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Budget / Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCampaigns.map((campaign) => {
                      const TypeIcon = getTypeIcon(campaign.type)
                      return (
                        <tr key={campaign.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-2 bg-gray-100 rounded-lg mr-3">
                                <TypeIcon className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                                <div className="text-sm text-gray-500">{campaign.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 capitalize">
                              {campaign.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(campaign.budget)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Spent: {formatCurrency(campaign.spent)}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">CTR:</span>
                                <span className="font-medium">{campaign.metrics.ctr}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Conv:</span>
                                <span className="font-medium">{campaign.metrics.conversionRate}%</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {campaign.status === 'active' && (
                                <button
                                  onClick={() => handleCampaignAction(campaign.id, 'pause')}
                                  className="text-yellow-600 hover:text-yellow-900"
                                  title="Pause Campaign"
                                >
                                  <PauseIcon className="w-4 h-4" />
                                </button>
                              )}
                              {(campaign.status === 'paused' || campaign.status === 'scheduled') && (
                                <button
                                  onClick={() => handleCampaignAction(campaign.id, 'play')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Start Campaign"
                                >
                                  <PlayIcon className="w-4 h-4" />
                                </button>
                              )}
                              {campaign.status === 'active' && (
                                <button
                                  onClick={() => handleCampaignAction(campaign.id, 'stop')}
                                  className="text-red-600 hover:text-red-900"
                                  title="Stop Campaign"
                                >
                                  <StopIcon className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedCampaign(campaign)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900" title="Edit">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Campaign Performance Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded">
                  <div className="text-center">
                    <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Performance Chart Placeholder</p>
                    <p className="text-sm text-gray-400 mt-2">Integrate with Chart.js or similar library</p>
                  </div>
                </div>
              </div>

              {/* ROI Analysis */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ROI Analysis</h3>
                <div className="space-y-4">
                  {campaigns.filter(c => c.status !== 'draft').map((campaign) => (
                    <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                        <span className="text-lg font-bold text-green-600">
                          {Math.round((campaign.metrics.conversions * 1000 - campaign.spent) / campaign.spent * 100)}% ROI
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Spent:</span>
                          <p className="font-medium">{formatCurrency(campaign.spent)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Conversions:</span>
                          <p className="font-medium">{campaign.metrics.conversions}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Revenue:</span>
                          <p className="font-medium">{formatCurrency(campaign.metrics.conversions * 1000)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audiences Tab */}
        {activeTab === 'audiences' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Audiences</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Restaurants</h4>
                  <p className="text-sm text-gray-600 mb-4">Active restaurant owners and managers</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">1,247</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active:</span>
                      <span className="font-medium">956</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Premium:</span>
                      <span className="font-medium">234</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Employees</h4>
                  <p className="text-sm text-gray-600 mb-4">Job seekers and active employees</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">8,934</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active:</span>
                      <span className="font-medium">6,712</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verified:</span>
                      <span className="font-medium">4,567</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Vendors</h4>
                  <p className="text-sm text-gray-600 mb-4">Marketplace suppliers and vendors</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">542</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active:</span>
                      <span className="font-medium">423</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Premium:</span>
                      <span className="font-medium">89</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Message Templates</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Create Template
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Welcome Email</h4>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Welcome new users to the platform</p>
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <p className="font-medium">Subject: Welcome to Resturistan!</p>
                    <p className="mt-2 text-gray-700">Hi {'{name}'}, Welcome to our platform...</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Verification Approved</h4>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Notify users of successful verification</p>
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <p className="font-medium">Subject: Verification Approved!</p>
                    <p className="mt-2 text-gray-700">Congratulations {'{name}'}, your account has been verified...</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Promotional SMS</h4>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">SMS template for promotions</p>
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <p className="font-medium">SMS Template:</p>
                    <p className="mt-2 text-gray-700">Hi {'{name}'}, Get {'{discount}'}% OFF on premium subscription. Use code: {'{code}'}</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Push Notification</h4>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Push notification for new features</p>
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <p className="font-medium">Title: New Feature Alert!</p>
                    <p className="mt-2 text-gray-700">{'{feature_name}'} is now available. Check it out!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Campaign Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Campaign</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
            <p className="text-gray-600 mb-4">Campaign creation form would go here...</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
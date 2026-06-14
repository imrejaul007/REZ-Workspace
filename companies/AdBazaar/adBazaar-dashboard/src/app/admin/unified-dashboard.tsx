'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Types
interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastCheck: Date;
}

interface MetricCard {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
}

interface QuickLink {
  title: string;
  href: string;
  icon: string;
  description: string;
}

// Service configurations
const SERVICES: Array<{ name: string; port: number; category: string }> = [
  { name: 'REZ-ads-api', port: 4001, category: 'ads' },
  { name: 'REZ-ads-service', port: 4002, category: 'ads' },
  { name: 'REZ-marketing-service', port: 4003, category: 'marketing' },
  { name: 'REZ-gamification-service', port: 3004, category: 'gamification' },
  { name: 'REZ-ai-campaign-builder', port: 4009, category: 'ai' },
  { name: 'REZ-media-analytics', port: 4069, category: 'analytics' },
  { name: 'REZ-realtime-dashboard', port: 3001, category: 'analytics' },
  { name: 'REZ-dooh-service', port: 4068, category: 'dooh' },
  { name: 'REZ-instagram-bridge', port: 4090, category: 'social' },
  { name: 'REZ-attribution-dashboard', port: 4080, category: 'attribution' },
];

export default function UnifiedAdminDashboard() {
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'campaigns'>('overview');

  // Mock metrics data
  const metrics: MetricCard[] = [
    { title: 'Total Campaigns', value: '156', change: '+12%', positive: true, icon: 'campaigns' },
    { title: 'Active Spend', value: '₹45.2L', change: '+8%', positive: true, icon: 'spend' },
    { title: 'Conversions', value: '8,900', change: '+23%', positive: true, icon: 'conversions' },
    { title: 'Avg ROAS', value: '3.2x', change: '+0.4', positive: true, icon: 'roas' },
  ];

  const quickLinks: QuickLink[] = [
    { title: 'Create Campaign', href: '/campaigns/builder', icon: 'plus', description: 'Build new campaign with AI' },
    { title: 'View Analytics', href: '/analytics', icon: 'chart', description: 'Cross-platform metrics' },
    { title: 'Calendar View', href: '/calendar', icon: 'calendar', description: 'Schedule & timeline' },
    { title: 'Manage Inventory', href: '/admin/inventory', icon: 'grid', description: 'Ad placements' },
    { title: 'User Management', href: '/admin/users', icon: 'users', description: 'Manage access' },
    { title: 'System Settings', href: '/admin/settings', icon: 'settings', description: 'Configuration' },
  ];

  useEffect(() => {
    // Simulate fetching service statuses
    const fetchServiceStatuses = () => {
      setLoading(true);
      setTimeout(() => {
        setServiceStatuses(
          SERVICES.map((service) => ({
            name: service.name,
            status: Math.random() > 0.1 ? 'healthy' : Math.random() > 0.5 ? 'degraded' : 'down',
            latency: Math.floor(Math.random() * 100) + 20,
            lastCheck: new Date(),
          }))
        );
        setLoading(false);
      }, 500);
    };

    fetchServiceStatuses();
    // Poll every 30 seconds
    const interval = setInterval(fetchServiceStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-amber-500';
      case 'down': return 'bg-red-500';
    }
  };

  const getStatusText = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'degraded': return 'Degraded';
      case 'down': return 'Down';
    }
  };

  // Calculate aggregate stats
  const healthyServices = serviceStatuses.filter((s) => s.status === 'healthy').length;
  const avgLatency = serviceStatuses.length > 0
    ? Math.round(serviceStatuses.reduce((acc, s) => acc + s.latency, 0) / serviceStatuses.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold">
              Ad<span className="text-amber-500">Bazaar</span>
            </Link>
            <span className="text-gray-400 text-sm">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">System Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700 px-6">
        <nav className="flex gap-6">
          {(['overview', 'services', 'campaigns'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'overview' && (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {metrics.map((metric) => (
                <div key={metric.title} className="bg-gray-800 rounded-xl p-6">
                  <div className="text-sm text-gray-400 mb-2">{metric.title}</div>
                  <div className="text-3xl font-bold mb-2">{metric.value}</div>
                  <div className={`text-sm ${metric.positive ? 'text-green-400' : 'text-red-400'}`}>
                    {metric.change} vs last period
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {quickLinks.map((link) => (
                  <Link
                    key={link.title}
                    href={link.href}
                    className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 text-center transition-colors"
                  >
                    <div className="text-2xl mb-2">
                      {link.icon === 'plus' && '+'}
                      {link.icon === 'chart' && '📊'}
                      {link.icon === 'calendar' && '📅'}
                      {link.icon === 'grid' && '⊞'}
                      {link.icon === 'users' && '👥'}
                      {link.icon === 'settings' && '⚙'}
                    </div>
                    <div className="font-medium text-sm">{link.title}</div>
                    <div className="text-xs text-gray-400 mt-1">{link.description}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Service Health */}
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Service Health</h2>
                  <button
                    onClick={() => setActiveTab('services')}
                    className="text-amber-500 text-sm hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-gray-400">Loading...</div>
                  ) : (
                    serviceStatuses.slice(0, 5).map((service) => (
                      <div key={service.name} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`} />
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-400">{service.latency}ms</span>
                          <span className={`text-sm ${
                            service.status === 'healthy' ? 'text-green-400' :
                            service.status === 'degraded' ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {getStatusText(service.status)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Campaigns */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Campaigns</h2>
                <div className="space-y-3">
                  {[
                    { name: 'Summer Sale 2026', platform: 'ReZ App', status: 'active', spend: '₹85K' },
                    { name: 'Monsoon Deals', platform: 'DOOH', status: 'active', spend: '₹62K' },
                    { name: 'Loyalty Rewards', platform: 'QR', status: 'paused', spend: '₹28K' },
                    { name: 'Flash Sale', platform: 'WhatsApp', status: 'active', spend: '₹15K' },
                    { name: 'Creator Collab', platform: 'Instagram', status: 'draft', spend: '-' },
                  ].map((campaign) => (
                    <div key={campaign.name} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-gray-400">{campaign.platform}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs px-2 py-1 rounded ${
                          campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          campaign.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {campaign.status}
                        </span>
                        <span className="text-sm text-gray-300">{campaign.spend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Platform Performance Summary */}
            <div className="mt-6 bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Platform Performance</h2>
              <div className="grid grid-cols-5 gap-4">
                {[
                  { name: 'ReZ App', impressions: '4.5M', conversions: '3,200', color: 'bg-blue-500' },
                  { name: 'DOOH', impressions: '3.2M', conversions: '2,100', color: 'bg-purple-500' },
                  { name: 'QR Campaigns', impressions: '2.8M', conversions: '2,400', color: 'bg-green-500' },
                  { name: 'WhatsApp', impressions: '1.5M', conversions: '800', color: 'bg-emerald-500' },
                  { name: 'Creator', impressions: '500K', conversions: '400', color: 'bg-pink-500' },
                ].map((platform) => (
                  <div key={platform.name} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-3 h-3 rounded ${platform.color}`} />
                      <span className="font-medium text-sm">{platform.name}</span>
                    </div>
                    <div className="text-2xl font-bold">{platform.impressions}</div>
                    <div className="text-sm text-gray-400">{platform.conversions} conv.</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'services' && (
          <>
            {/* Service Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-sm text-gray-400 mb-2">Total Services</div>
                <div className="text-3xl font-bold">{SERVICES.length}</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-sm text-gray-400 mb-2">Healthy</div>
                <div className="text-3xl font-bold text-green-400">{healthyServices}</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-sm text-gray-400 mb-2">Avg Latency</div>
                <div className="text-3xl font-bold text-amber-400">{avgLatency}ms</div>
              </div>
            </div>

            {/* Service List */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">All Services</h2>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-gray-400">Loading services...</div>
                ) : (
                  serviceStatuses.map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className={`w-4 h-4 rounded-full ${getStatusColor(service.status)}`} />
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-400">Port: {
                            SERVICES.find(s => s.name === service.name)?.port || 'N/A'
                          }</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Latency</div>
                          <div className="font-medium">{service.latency}ms</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Status</div>
                          <div className={`font-medium ${
                            service.status === 'healthy' ? 'text-green-400' :
                            service.status === 'degraded' ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {getStatusText(service.status)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Last Check</div>
                          <div className="font-medium text-sm">
                            {service.lastCheck.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'campaigns' && (
          <>
            {/* Campaign Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-sm text-gray-400 mb-2">Total Campaigns</div>
                <div className="text-3xl font-bold">156</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-sm text-gray-400 mb-2">Active</div>
                <div className="text-3xl font-bold text-green-400">42</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-sm text-gray-400 mb-2">Paused</div>
                <div className="text-3xl font-bold text-amber-400">18</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-sm text-gray-400 mb-2">Completed</div>
                <div className="text-3xl font-bold text-gray-400">96</div>
              </div>
            </div>

            {/* Campaign List */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">All Campaigns</h2>
                <Link
                  href="/campaigns/builder"
                  className="bg-amber-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-amber-400 transition-colors"
                >
                  + New Campaign
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-3">Campaign</th>
                      <th className="pb-3">Platform</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Budget</th>
                      <th className="pb-3">Spent</th>
                      <th className="pb-3">Conv.</th>
                      <th className="pb-3">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Summer Sale 2026', platform: 'ReZ App', status: 'active', budget: '₹1L', spent: '₹85K', conv: '1,245', roas: '3.8x' },
                      { name: 'Monsoon Deals', platform: 'DOOH', status: 'active', budget: '₹80K', spent: '₹62K', conv: '890', roas: '3.2x' },
                      { name: 'Loyalty Rewards', platform: 'QR', status: 'paused', budget: '₹50K', spent: '₹28K', conv: '756', roas: '2.9x' },
                      { name: 'Flash Sale', platform: 'WhatsApp', status: 'active', budget: '₹25K', spent: '₹15K', conv: '423', roas: '4.1x' },
                      { name: 'Creator Collab', platform: 'Instagram', status: 'draft', budget: '₹1.5L', spent: '-', conv: '-', roas: '-' },
                    ].map((campaign, i) => (
                      <tr key={i} className="border-b border-gray-700">
                        <td className="py-4 font-medium">{campaign.name}</td>
                        <td className="py-4 text-gray-400">{campaign.platform}</td>
                        <td className="py-4">
                          <span className={`text-xs px-2 py-1 rounded ${
                            campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            campaign.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="py-4">{campaign.budget}</td>
                        <td className="py-4">{campaign.spent}</td>
                        <td className="py-4">{campaign.conv}</td>
                        <td className="py-4 text-amber-400">{campaign.roas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

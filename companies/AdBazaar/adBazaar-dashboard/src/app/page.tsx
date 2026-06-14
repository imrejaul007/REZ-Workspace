'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpend: number;
  totalImpressions: number;
  totalConversions: number;
  roas: number;
  flywheelHealth: number;
}

interface PlatformMetrics {
  platform: string;
  campaigns: number;
  impressions: number;
  conversions: number;
  spend: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSpend: 0,
    totalImpressions: 0,
    totalConversions: 0,
    roas: 0,
    flywheelHealth: 0,
  });

  const [platforms, setPlatforms] = useState<PlatformMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch from actual services
    setTimeout(() => {
      setStats({
        totalCampaigns: 156,
        activeCampaigns: 42,
        totalSpend: 4520000,
        totalImpressions: 12500000,
        totalConversions: 8900,
        roas: 3.2,
        flywheelHealth: 78,
      });

      setPlatforms([
        { platform: 'ReZ App', campaigns: 45, impressions: 4500000, conversions: 3200, spend: 1800000 },
        { platform: 'DOOH', campaigns: 38, impressions: 3200000, conversions: 2100, spend: 980000 },
        { platform: 'QR Campaigns', campaigns: 52, impressions: 2800000, conversions: 2400, spend: 650000 },
        { platform: 'WhatsApp', campaigns: 28, impressions: 1500000, conversions: 800, spend: 520000 },
        { platform: 'Creator', campaigns: 21, impressions: 500000, conversions: 400, spend: 570000 },
      ]);

      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">
              Ad<span className="text-amber-500">Bazaar</span>
            </span>
            <span className="text-gray-400">Unified Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <select className="bg-gray-700 text-white px-3 py-2 rounded-lg">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>Last 90 Days</option>
            </select>
            <div className="text-sm text-gray-400">
              Admin
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Campaigns"
            value={stats.totalCampaigns.toString()}
            subtitle={`${stats.activeCampaigns} active`}
            trend="+12%"
            positive
          />
          <StatCard
            title="Total Spend"
            value={`₹${(stats.totalSpend / 100000).toFixed(1)}L`}
            subtitle="This month"
            trend="+8%"
            positive
          />
          <StatCard
            title="Conversions"
            value={stats.totalConversions.toLocaleString()}
            subtitle="All platforms"
            trend="+23%"
            positive
          />
          <StatCard
            title="Flywheel Health"
            value={`${stats.flywheelHealth}%`}
            subtitle="Ecosystem score"
            trend={stats.flywheelHealth > 70 ? 'Healthy' : 'Needs attention'}
            positive={stats.flywheelHealth > 70}
          />
        </div>

        {/* Platform Performance */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Platform Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3">Platform</th>
                  <th className="pb-3">Campaigns</th>
                  <th className="pb-3">Impressions</th>
                  <th className="pb-3">Conversions</th>
                  <th className="pb-3">Spend</th>
                  <th className="pb-3">CVR</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((platform) => (
                  <tr key={platform.platform} className="border-b border-gray-700">
                    <td className="py-4 font-medium">{platform.platform}</td>
                    <td className="py-4">{platform.campaigns}</td>
                    <td className="py-4">{(platform.impressions / 1000000).toFixed(1)}M</td>
                    <td className="py-4">{platform.conversions.toLocaleString()}</td>
                    <td className="py-4">₹{(platform.spend / 1000).toFixed(0)}K</td>
                    <td className="py-4">
                      {((platform.conversions / platform.impressions) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Campaigns */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Top Campaigns</h2>
            <div className="space-y-4">
              {[
                { name: 'Summer Sale 2026', platform: 'ReZ App', conversions: 1245, spend: 85000 },
                { name: 'Monsoon Deals', platform: 'DOOH', conversions: 890, spend: 62000 },
                { name: 'Loyalty Rewards', platform: 'QR', conversions: 756, spend: 28000 },
              ].map((campaign, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium">{campaign.name}</div>
                    <div className="text-sm text-gray-400">{campaign.platform}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{campaign.conversions} conv.</div>
                    <div className="text-sm text-gray-400">₹{(campaign.spend / 1000).toFixed(0)}K</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flywheel Status */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Ecosystem Flywheel</h2>
            <div className="space-y-4">
              <FlywheelStage name="QR Scans" value={125000} target={100000} />
              <FlywheelStage name="Campaign Views" value={45000} target={50000} />
              <FlywheelStage name="Conversions" value={8900} target={8000} />
              <FlywheelStage name="Repeat Purchases" value={3200} target={3000} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-amber-500 text-black font-semibold py-4 px-6 rounded-xl hover:bg-amber-400 transition-colors">
            + Create Campaign
          </button>
          <button className="bg-gray-700 text-white font-semibold py-4 px-6 rounded-xl hover:bg-gray-600 transition-colors">
            View Inventory
          </button>
          <button className="bg-gray-700 text-white font-semibold py-4 px-6 rounded-xl hover:bg-gray-600 transition-colors">
            Generate Report
          </button>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, subtitle, trend, positive }: {
  title: string;
  value: string;
  subtitle: string;
  trend: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="text-sm text-gray-400 mb-2">{title}</div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{subtitle}</span>
        <span className={`text-sm ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function FlywheelStage({ name, value, target }: { name: string; value: number; target: number }) {
  const percentage = Math.min(100, (value / target) * 100);
  const color = percentage >= 100 ? 'bg-green-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{name}</span>
        <span>{value.toLocaleString()} / {target.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

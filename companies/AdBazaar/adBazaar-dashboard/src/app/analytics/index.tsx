'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MetricData {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cvr: number;
  cpm: number;
  cpc: number;
  roas: number;
}

interface PlatformMetrics extends MetricData {
  platform: string;
  color: string;
  trend: number;
}

interface TrendDataPoint {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

interface ROIDataPoint {
  label: string;
  spend: number;
  revenue: number;
  roi: number;
}

// Platform configurations
const PLATFORMS = [
  { id: 'rez-app', name: 'ReZ App', color: '#3B82F6', icon: '📱' },
  { id: 'dooh', name: 'DOOH', color: '#8B5CF6', icon: '🖥️' },
  { id: 'qr', name: 'QR Campaigns', color: '#10B981', icon: '📱' },
  { id: 'whatsapp', name: 'WhatsApp', color: '#059669', icon: '💬' },
  { id: 'instagram', name: 'Instagram', color: '#EC4899', icon: '📸' },
];

export default function AnalyticsDashboard() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'roi' | 'trends'>('overview');

  // Mock aggregated metrics
  const [metrics, setMetrics] = useState<MetricData>({
    impressions: 0,
    clicks: 0,
    conversions: 0,
    spend: 0,
    revenue: 0,
    ctr: 0,
    cvr: 0,
    cpm: 0,
    cpc: 0,
    roas: 0,
  });

  // Mock platform data
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics[]>([]);

  // Mock trend data
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);

  useEffect(() => {
    // Simulate data fetching
    setLoading(true);
    setTimeout(() => {
      // Platform metrics
      setPlatformMetrics([
        { platform: 'ReZ App', color: '#3B82F6', impressions: 4500000, clicks: 180000, conversions: 3200, spend: 1800000, revenue: 5760000, ctr: 4.0, cvr: 1.78, cpm: 400, cpc: 10, roas: 3.2, trend: 12 },
        { platform: 'DOOH', color: '#8B5CF6', impressions: 3200000, clicks: 96000, conversions: 2100, spend: 980000, revenue: 2940000, ctr: 3.0, cvr: 2.19, cpm: 306, cpc: 10.2, roas: 3.0, trend: 8 },
        { platform: 'QR Campaigns', color: '#10B981', impressions: 2800000, clicks: 140000, conversions: 2400, spend: 650000, revenue: 2340000, ctr: 5.0, cvr: 1.71, cpm: 232, cpc: 4.6, roas: 3.6, trend: 23 },
        { platform: 'WhatsApp', color: '#059669', impressions: 1500000, clicks: 75000, conversions: 800, spend: 520000, revenue: 1560000, ctr: 5.0, cvr: 1.07, cpm: 347, cpc: 6.9, roas: 3.0, trend: 15 },
        { platform: 'Instagram', color: '#EC4899', impressions: 500000, clicks: 25000, conversions: 400, spend: 570000, revenue: 1710000, ctr: 5.0, cvr: 1.6, cpm: 1140, cpc: 22.8, roas: 3.0, trend: -5 },
      ]);

      // Aggregate metrics
      const total = platformMetrics.reduce(
        (acc, p) => ({
          impressions: acc.impressions + p.impressions,
          clicks: acc.clicks + p.clicks,
          conversions: acc.conversions + p.conversions,
          spend: acc.spend + p.spend,
          revenue: acc.revenue + p.revenue,
        }),
        { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
      );

      setMetrics({
        ...total,
        ctr: (total.clicks / total.impressions) * 100,
        cvr: (total.conversions / total.clicks) * 100,
        cpm: (total.spend / total.impressions) * 1000,
        cpc: total.spend / total.clicks,
        roas: total.revenue / total.spend,
      });

      // Generate trend data
      const trends: TrendDataPoint[] = [];
      const now = new Date();
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        trends.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          impressions: Math.floor(350000 + Math.random() * 100000),
          clicks: Math.floor(14000 + Math.random() * 4000),
          conversions: Math.floor(250 + Math.random() * 100),
          spend: Math.floor(130000 + Math.random() * 30000),
        });
      }
      setTrendData(trends);
      setLoading(false);
    }, 500);
  }, []);

  const filteredMetrics = selectedPlatform === 'all'
    ? metrics
    : platformMetrics.find((p) => p.platform.toLowerCase().replace(' ', '-') === selectedPlatform) || metrics;

  // Calculate ROI breakdown
  const roiBreakdown: ROIDataPoint[] = [
    { label: 'ReZ App', spend: 1800000, revenue: 5760000, roi: 3.2 },
    { label: 'DOOH', spend: 980000, revenue: 2940000, roi: 3.0 },
    { label: 'QR Campaigns', spend: 650000, revenue: 2340000, roi: 3.6 },
    { label: 'WhatsApp', spend: 520000, revenue: 1560000, roi: 3.0 },
    { label: 'Instagram', spend: 570000, revenue: 1710000, roi: 3.0 },
  ];

  // Find max value for chart scaling
  const maxTrendValue = Math.max(...trendData.map((d) => d.impressions));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/unified-dashboard" className="text-2xl font-bold">
              Ad<span className="text-amber-500">Bazaar</span>
            </Link>
            <span className="text-gray-400">Analytics</span>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
            >
              <option value="all">All Platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
      </header>

      {/* View Tabs */}
      <div className="border-b border-gray-700 px-6">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'roi', label: 'ROI Analysis' },
            { id: 'trends', label: 'Trends' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as typeof activeView)}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeView === tab.id
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400 text-xl">Loading analytics...</div>
          </div>
        ) : (
          <>
            {/* Overview View */}
            {activeView === 'overview' && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                  <MetricCard
                    label="Impressions"
                    value={(filteredMetrics.impressions / 1000000).toFixed(1) + 'M'}
                    change="+12%"
                    positive
                  />
                  <MetricCard
                    label="Clicks"
                    value={(filteredMetrics.clicks / 1000).toFixed(0) + 'K'}
                    change="+8%"
                    positive
                  />
                  <MetricCard
                    label="Conversions"
                    value={filteredMetrics.conversions.toLocaleString()}
                    change="+23%"
                    positive
                  />
                  <MetricCard
                    label="CTR"
                    value={filteredMetrics.ctr.toFixed(2) + '%'}
                    change="+0.3%"
                    positive
                  />
                  <MetricCard
                    label="CPC"
                    value={'₹' + filteredMetrics.cpc.toFixed(2)}
                    change="-5%"
                    positive={false}
                  />
                  <MetricCard
                    label="ROAS"
                    value={filteredMetrics.roas.toFixed(1) + 'x'}
                    change="+0.4x"
                    positive
                  />
                </div>

                {/* Platform Breakdown */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Platform Performance</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-700">
                          <th className="pb-3">Platform</th>
                          <th className="pb-3">Impressions</th>
                          <th className="pb-3">Clicks</th>
                          <th className="pb-3">CTR</th>
                          <th className="pb-3">Conv.</th>
                          <th className="pb-3">Spend</th>
                          <th className="pb-3">Revenue</th>
                          <th className="pb-3">ROAS</th>
                          <th className="pb-3">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {platformMetrics.map((platform) => (
                          <tr key={platform.platform} className="border-b border-gray-700">
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: platform.color }}
                                />
                                {platform.platform}
                              </div>
                            </td>
                            <td className="py-4">{(platform.impressions / 1000000).toFixed(1)}M</td>
                            <td className="py-4">{(platform.clicks / 1000).toFixed(0)}K</td>
                            <td className="py-4">{platform.ctr.toFixed(2)}%</td>
                            <td className="py-4">{platform.conversions.toLocaleString()}</td>
                            <td className="py-4">₹{(platform.spend / 100000).toFixed(1)}L</td>
                            <td className="py-4">₹{(platform.revenue / 100000).toFixed(1)}L</td>
                            <td className="py-4 text-amber-400">{platform.roas.toFixed(1)}x</td>
                            <td className="py-4">
                              <span className={platform.trend >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {platform.trend >= 0 ? '+' : ''}{platform.trend}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Visual Bar Chart */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Spend vs Revenue by Platform</h2>
                  <div className="space-y-4">
                    {platformMetrics.map((platform) => {
                      const maxSpend = Math.max(...platformMetrics.map((p) => p.spend));
                      const spendWidth = (platform.spend / maxSpend) * 100;
                      const revenueWidth = (platform.revenue / maxSpend) * 100;
                      return (
                        <div key={platform.platform}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{platform.platform}</span>
                            <span className="text-sm text-gray-400">
                              Spend: ₹{(platform.spend / 100000).toFixed(1)}L | Revenue: ₹{(platform.revenue / 100000).toFixed(1)}L
                            </span>
                          </div>
                          <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="absolute h-full bg-gray-500 rounded-full"
                              style={{ width: `${spendWidth}%` }}
                            />
                            <div
                              className="absolute h-full rounded-full"
                              style={{
                                width: `${revenueWidth}%`,
                                backgroundColor: platform.color,
                                opacity: 0.8,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-6 mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-500 rounded" />
                      <span className="text-sm text-gray-400">Spend</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded" />
                      <span className="text-sm text-gray-400">Revenue</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ROI Analysis View */}
            {activeView === 'roi' && (
              <>
                {/* ROI Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-800 rounded-xl p-6">
                    <div className="text-sm text-gray-400 mb-2">Total Spend</div>
                    <div className="text-3xl font-bold">₹{((metrics.spend) / 100000).toFixed(1)}L</div>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-6">
                    <div className="text-sm text-gray-400 mb-2">Total Revenue</div>
                    <div className="text-3xl font-bold text-green-400">₹{(metrics.revenue / 100000).toFixed(1)}L</div>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-6">
                    <div className="text-sm text-gray-400 mb-2">Overall ROAS</div>
                    <div className="text-3xl font-bold text-amber-400">{metrics.roas.toFixed(1)}x</div>
                    <div className="text-sm text-green-400 mt-1">+0.4x vs last period</div>
                  </div>
                </div>

                {/* ROI Breakdown Table */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">ROI by Platform</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-700">
                          <th className="pb-3">Platform</th>
                          <th className="pb-3">Spend</th>
                          <th className="pb-3">Revenue</th>
                          <th className="pb-3">Profit</th>
                          <th className="pb-3">ROAS</th>
                          <th className="pb-3">Efficiency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roiBreakdown.map((item) => {
                          const profit = item.revenue - item.spend;
                          const efficiency = item.roi >= 3 ? 'Excellent' : item.roi >= 2 ? 'Good' : 'Needs Improvement';
                          return (
                            <tr key={item.label} className="border-b border-gray-700">
                              <td className="py-4 font-medium">{item.label}</td>
                              <td className="py-4">₹{(item.spend / 100000).toFixed(1)}L</td>
                              <td className="py-4 text-green-400">₹{(item.revenue / 100000).toFixed(1)}L</td>
                              <td className="py-4 text-green-400">₹{(profit / 100000).toFixed(1)}L</td>
                              <td className="py-4 text-amber-400 font-bold">{item.roi.toFixed(1)}x</td>
                              <td className="py-4">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  efficiency === 'Excellent' ? 'bg-green-500/20 text-green-400' :
                                  efficiency === 'Good' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {efficiency}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ROI Visualization */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6">ROAS Comparison</h2>
                  <div className="space-y-4">
                    {roiBreakdown
                      .sort((a, b) => b.roi - a.roi)
                      .map((item) => {
                        const maxROI = Math.max(...roiBreakdown.map((r) => r.roi));
                        const width = (item.roi / maxROI) * 100;
                        const platformColor = PLATFORMS.find((p) => p.name === item.label)?.color || '#6B7280';
                        return (
                          <div key={item.label}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{item.label}</span>
                              <span className="text-amber-400 font-bold">{item.roi.toFixed(1)}x</span>
                            </div>
                            <div className="h-6 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${width}%`,
                                  backgroundColor: platformColor,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="text-amber-400 font-medium">Recommendation</div>
                    <p className="text-sm text-gray-300 mt-1">
                      QR Campaigns show the highest ROAS (3.6x). Consider increasing budget allocation by 20% to maximize returns.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Trends View */}
            {activeView === 'trends' && (
              <>
                {/* Trend Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <MetricCard
                    label="Impressions (30d)"
                    value={(trendData.reduce((a, b) => a + b.impressions, 0) / 1000000).toFixed(1) + 'M'}
                    change="+12%"
                    positive
                  />
                  <MetricCard
                    label="Clicks (30d)"
                    value={(trendData.reduce((a, b) => a + b.clicks, 0) / 1000).toFixed(0) + 'K'}
                    change="+8%"
                    positive
                  />
                  <MetricCard
                    label="Conv. (30d)"
                    value={trendData.reduce((a, b) => a + b.conversions, 0).toLocaleString()}
                    change="+23%"
                    positive
                  />
                  <MetricCard
                    label="Spend (30d)"
                    value={'₹' + (trendData.reduce((a, b) => a + b.spend, 0) / 100000).toFixed(1) + 'L'}
                    change="+5%"
                    positive
                  />
                </div>

                {/* Line Chart - Impressions Trend */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-6">Impressions Trend</h2>
                  <div className="h-64 flex items-end gap-1">
                    {trendData.map((point, i) => {
                      const height = (point.impressions / maxTrendValue) * 100;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-400"
                          style={{ height: `${height}%` }}
                          title={`${point.date}: ${point.impressions.toLocaleString()} impressions`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{trendData[0]?.date}</span>
                    <span>{trendData[trendData.length - 1]?.date}</span>
                  </div>
                </div>

                {/* Dual Axis Chart - Spend vs Conversions */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-6">Spend vs Conversions</h2>
                  <div className="h-64 flex items-end gap-4">
                    {/* Spend bars */}
                    <div className="flex-1 flex items-end gap-1">
                      {trendData.map((point, i) => {
                        const maxSpend = Math.max(...trendData.map((d) => d.spend));
                        const height = (point.spend / maxSpend) * 100;
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-gray-500 rounded-t transition-all hover:bg-gray-400"
                            style={{ height: `${height}%` }}
                            title={`${point.date}: ₹${point.spend.toLocaleString()}`}
                          />
                        );
                      })}
                    </div>
                    {/* Conversions line overlay */}
                    <div className="w-1 bg-amber-500 relative" style={{ height: '256px' }}>
                      <div
                        className="absolute bottom-0 left-0 w-full bg-amber-500/50 rounded"
                        style={{
                          height: `${(trendData[trendData.length - 1]?.conversions / Math.max(...trendData.map(d => d.conversions))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-500 rounded" />
                      <span className="text-sm text-gray-400">Daily Spend</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-amber-500 rounded" />
                      <span className="text-sm text-gray-400">Conversions</span>
                    </div>
                  </div>
                </div>

                {/* Daily Breakdown Table */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">Recent Daily Performance</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-700">
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Impressions</th>
                          <th className="pb-3">Clicks</th>
                          <th className="pb-3">Conv.</th>
                          <th className="pb-3">Spend</th>
                          <th className="pb-3">CPC</th>
                          <th className="pb-3">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trendData.slice(-10).reverse().map((point, i) => (
                          <tr key={i} className="border-b border-gray-700">
                            <td className="py-3">{point.date}</td>
                            <td className="py-3">{(point.impressions / 1000).toFixed(0)}K</td>
                            <td className="py-3">{(point.clicks / 1000).toFixed(0)}K</td>
                            <td className="py-3">{point.conversions}</td>
                            <td className="py-3">₹{(point.spend / 1000).toFixed(0)}K</td>
                            <td className="py-3">₹{(point.spend / point.clicks).toFixed(2)}</td>
                            <td className="py-3">
                              {i < trendData.length - 1 && (
                                <span className={
                                  point.conversions >= trendData[trendData.length - i]?.conversions
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }>
                                  {point.conversions >= trendData[trendData.length - i]?.conversions ? '↑' : '↓'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  label,
  value,
  change,
  positive,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className={`text-sm ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {change}
      </div>
    </div>
  );
}

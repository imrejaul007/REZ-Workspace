'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { campaignData } from '@/lib/mock-data';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-100 border border-slate-700 rounded-lg p-4 shadow-xl min-w-48">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-400">{entry.name}:</span>
            <span className="text-white font-medium">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function CampaignChart() {
  // Calculate ROI for each campaign
  const campaignWithROI = campaignData.map((campaign) => ({
    ...campaign,
    roi: ((campaign.revenue - campaign.spend) / campaign.spend) * 100,
    ctr: (campaign.clicks / campaign.impressions) * 100,
    conversionRate: (campaign.conversions / campaign.clicks) * 100,
  }));

  return (
    <div className="space-y-6">
      {/* Campaign Performance Bar Chart */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-white mb-4">Campaign Overview</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={campaignData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                formatter={(value) => <span className="text-slate-300">{value}</span>}
              />
              <Bar
                dataKey="impressions"
                fill="#6366f1"
                name="Impressions"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="clicks"
                fill="#0ea5e9"
                name="Clicks"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="conversions"
                fill="#10b981"
                name="Conversions"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign Metrics Table */}
      <div className="chart-container overflow-hidden">
        <h3 className="text-lg font-semibold text-white mb-4">Campaign Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Campaign</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Impressions</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">CTR</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Conversions</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Spend</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Revenue</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">ROI</th>
              </tr>
            </thead>
            <tbody>
              {campaignWithROI.map((campaign, index) => (
                <tr
                  key={campaign.name}
                  className="border-b border-slate-800 hover:bg-dark-100/50 transition-colors"
                >
                  <td className="py-3 px-4 text-white font-medium">{campaign.name}</td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    {campaign.impressions.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-primary-400">
                    {campaign.ctr.toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-right text-green-400">
                    {campaign.conversions.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    ${campaign.spend.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-yellow-400 font-medium">
                    ${campaign.revenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-medium ${
                        campaign.roi >= 200
                          ? 'bg-green-500/20 text-green-400'
                          : campaign.roi >= 100
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {campaign.roi.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

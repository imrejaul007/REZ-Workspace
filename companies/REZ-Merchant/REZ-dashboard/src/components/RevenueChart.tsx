'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { revenueData } from '@/lib/mock-data';

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
      <div className="bg-dark-100 border border-slate-700 rounded-lg p-4 shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="text-white font-medium">
              ${entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function RevenueChart() {
  // Calculate summary stats
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalTarget = revenueData.reduce((sum, d) => sum + d.target, 0);
  const targetAchievement = ((totalRevenue / totalTarget) * 100).toFixed(1);
  const avgDailyRevenue = Math.round(totalRevenue / revenueData.length);
  const bestDay = Math.max(...revenueData.map((d) => d.revenue));
  const bestDayDate = revenueData.find((d) => d.revenue === bestDay)?.date;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-dark-100 rounded-lg p-3 text-center">
          <p className="text-slate-400 text-xs mb-1">Total Revenue</p>
          <p className="text-yellow-400 text-lg font-bold">
            ${(totalRevenue / 1000).toFixed(1)}K
          </p>
        </div>
        <div className="bg-dark-100 rounded-lg p-3 text-center">
          <p className="text-slate-400 text-xs mb-1">Target Achievement</p>
          <p className="text-green-400 text-lg font-bold">{targetAchievement}%</p>
        </div>
        <div className="bg-dark-100 rounded-lg p-3 text-center">
          <p className="text-slate-400 text-xs mb-1">Avg Daily</p>
          <p className="text-primary-400 text-lg font-bold">
            ${(avgDailyRevenue / 1000).toFixed(1)}K
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={revenueData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.getDate().toString();
              }}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => <span className="text-slate-300">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
            <Area
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#targetGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Best Day Info */}
      <p className="text-slate-500 text-sm text-center">
        Best performing day:{' '}
        <span className="text-green-400">
          {new Date(bestDayDate || '').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </span>{' '}
        with ${bestDay.toLocaleString()} revenue
      </p>
    </div>
  );
}

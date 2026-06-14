'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

interface ForecastChartProps {
  data: {
    actual: Array<{ month: string; value: number }>;
    forecast: Array<{ month: string; value: number }>;
    target: Array<{ month: string; value: number }>;
  };
}

export default function ForecastChart({ data }: ForecastChartProps) {
  const chartData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => ({
    month,
    actual: data.actual[i]?.value || 0,
    forecast: data.forecast[i]?.value || 0,
    target: data.target[i]?.value || 0,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}K`} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            formatter={(value: number) => [`$${value}K`, '']}
          />
          <Legend />
          <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name="Actual" />
          <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#3b82f6' }} name="Forecast" />
          <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="2 2" name="Target" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

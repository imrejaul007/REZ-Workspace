'use client';

import { useState } from 'react';

const metrics = [
  { label: 'Total Employees', value: 45, change: '+3', trend: 'up' },
  { label: 'Avg Attendance', value: '94%', change: '+2%', trend: 'up' },
  { label: 'Productivity Score', value: 87, change: '+5', trend: 'up' },
  { label: 'Turnover Rate', value: '8%', change: '-2%', trend: 'down' },
];

const charts = [
  { id: 'attendance', name: 'Attendance Trend', data: [85, 88, 90, 92, 94, 96] },
  { id: 'departments', name: 'Headcount by Department', data: [15, 12, 10, 8] },
];

const insights = [
  { type: 'positive', text: 'Engineering team productivity increased 12% this month' },
  { type: 'warning', text: '3 employees at risk of burnout - review workload' },
  { type: 'positive', text: 'Attendance improved 5% after WFH policy update' },
  { type: 'info', text: 'Top performers: Sales team exceeded target by 15%' },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>📊 Advanced Analytics</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>AI-powered workforce insights</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{ padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: 8 }}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{m.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <p style={{ fontSize: 32, fontWeight: 700, color: '#1f2937', margin: '8px 0 0' }}>{m.value}</p>
              <span style={{
                fontSize: 12, color: m.trend === 'up' ? '#10b981' : '#ef4444',
                background: m.trend === 'up' ? '#dcfce7' : '#fee2e2',
                padding: '2px 8px', borderRadius: 10
              }}>
                {m.trend === 'up' ? '↑' : '↓'} {m.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Attendance Chart */}
        <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
          <h2 style={{ marginBottom: 16 }}>Attendance Trend</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 200 }}>
            {[85, 88, 90, 92, 94, 96].map((val, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: `${val * 2}px`, background: 'linear-gradient(to top, #10b981, #34d399', borderRadius: '8px 8px 0 0' }} />
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>W{i + 1}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
          <h2 style={{ marginBottom: 16 }}>🤖 AI Insights</h2>
          {insights.map((insight, i) => (
            <div key={i} style={{
              padding: 12, borderRadius: 8, marginBottom: 8,
              background: insight.type === 'positive' ? '#dcfce7' :
                          insight.type === 'warning' ? '#fef3c7' : '#dbeafe'
            }}>
              <p style={{ fontSize: 13, margin: 0, color: insight.type === 'positive' ? '#15803d' :
                        insight.type === 'warning' ? '#b45309' : '#1d4ed8' }}>
                {insight.type === 'positive' ? '✅' : insight.type === 'warning' ? '⚠️' : '💡'} {insight.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {/* Department Breakdown */}
        <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
          <h2 style={{ marginBottom: 16 }}>Department Distribution</h2>
          {[
            { dept: 'Engineering', count: 15, color: '#8b5cf6' },
            { dept: 'Marketing', count: 12, color: '#06b6d4' },
            { dept: 'Sales', count: 10, color: '#10b981' },
            { dept: 'HR', count: 8, color: '#f59e0b' },
          ].map(d => (
            <div key={d.dept} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13 }}>{d.dept}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{d.count}</span>
              </div>
              <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                <div style={{ width: `${d.count / 15 * 100}%`, height: '100%', background: d.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Predictions */}
        <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
          <h2 style={{ marginBottom: 16 }}>🔮 Predictions</h2>
          <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#15803d', margin: 0 }}>Attrition Risk</p>
            <p style={{ fontSize: 12, color: '#166534', margin: '4px 0 0' }}>2 employees at high risk - recommend retention meeting</p>
          </div>
          <div style={{ padding: 16, background: '#fef3c7', borderRadius: 8, marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#b45309', margin: 0 }}>Productivity Spike</p>
            <p style={{ fontSize: 12, color: '#92400e', margin: '4px 0 0' }}>Expected 15% increase next quarter</p>
          </div>
          <div style={{ padding: 16, background: '#eff6ff', borderRadius: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8', margin: 0 }}>Hiring Need</p>
            <p style={{ fontSize: 12, color: '#1e40af', margin: '4px 0 0' }}>3 new hires needed by July</p>
          </div>
        </div>

        {/* Benchmarks */}
        <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
          <h2 style={{ marginBottom: 16 }}>📈 Benchmarks</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ textAlign: 'center', padding: 16, background: '#f3f4f6', borderRadius: 8 }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#10b981', margin: 0 }}>94%</p>
              <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>vs Industry 87%</p>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#f3f4f6', borderRadius: 8 }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#10b981', margin: 0 }}>8%</p>
              <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>vs Industry 15%</p>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#f3f4f6', borderRadius: 8 }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#10b981', margin: 0 }}>4.2</p>
              <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>eNPS Score</p>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#f3f4f6', borderRadius: 8 }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#10b981', margin: 0 }}>18</p>
              <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>Avg Tenure (months)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

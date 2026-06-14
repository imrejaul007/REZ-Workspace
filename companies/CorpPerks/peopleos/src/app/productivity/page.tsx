'use client';

import { useState } from 'react';

const employees = [
  { id: 1, name: 'Priya Sharma', dept: 'Engineering', score: 92, trend: '+5', attendance: 98, tasks: 85, engagement: 94 },
  { id: 2, name: 'Rahul Verma', dept: 'Engineering', score: 87, trend: '+3', attendance: 95, tasks: 78, engagement: 88 },
  { id: 3, name: 'Sneha Patel', dept: 'Marketing', score: 78, trend: '-2', attendance: 92, tasks: 65, engagement: 77 },
  { id: 4, name: 'Amit Kumar', dept: 'Sales', score: 95, trend: '+8', attendance: 100, tasks: 92, engagement: 94 },
  { id: 5, name: 'Neha Gupta', dept: 'HR', score: 88, trend: '+4', attendance: 97, tasks: 82, engagement: 85 },
];

export default function ProductivityPage() {
  const [period, setPeriod] = useState('30d');

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Productivity Index</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>AI-powered workforce productivity scoring</p>
        </div>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
      </div>

      {/* Overall Score */}
      <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', padding: 32, borderRadius: 16, color: 'white', marginBottom: 24 }}>
        <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>Company Productivity Index</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 8 }}>
          <span style={{ fontSize: 72, fontWeight: 700 }}>87</span>
          <div>
            <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, fontSize: 13 }}>+4.2% vs last month</span>
            <p style={{ margin: '8px 0 0', opacity: 0.9 }}>Based on 245 employees</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Attendance Score', value: '96%', icon: '✅', change: '+2%' },
          { label: 'Task Completion', value: '82%', icon: '📋', change: '+5%' },
          { label: 'Engagement', value: '89%', icon: '💬', change: '+3%' },
          { label: 'On-time Rate', value: '94%', icon: '⏰', change: '+4%' },
        ].map(m => (
          <div key={m.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 28 }}>{m.icon}</span>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6', margin: '8px 0 0' }}>{m.value}</p>
            <p style={{ fontSize: 12, color: '#10b981', margin: '4px 0 0' }}>{m.change}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{m.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Rankings */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px' }}>Top Performers</h2>
          {employees.sort((a, b) => b.score - a.score).map((emp, i) => (
            <div key={emp.id} style={{
              padding: 16, background: '#f9fafb', borderRadius: 12, marginBottom: 12,
              borderLeft: i === 0 ? '4px solid #ffd700' : i === 1 ? '4px solid #c0c0c0' : i === 2 ? '4px solid #cd7f32' : '4px solid transparent'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: i < 3 ? '#ffd700' : '#6b7280' }}>#{i + 1}</span>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>{emp.name.split(' ').map(n => n[0]).join('')}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, margin: 0 }}>{emp.name}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{emp.dept}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>{emp.score}</span>
                  <span style={{ fontSize: 12, color: '#10b981' }}> {emp.trend}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                {[
                  { label: 'Attendance', value: emp.attendance },
                  { label: 'Tasks', value: emp.tasks },
                  { label: 'Engagement', value: emp.engagement },
                ].map(m => (
                  <div key={m.label} style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{m.label}: <strong>{m.value}%</strong></p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* AI Insights */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px' }}>🤖 AI Insights</h2>
          {[
            { type: 'warning', icon: '⚠️', text: '3 employees showing declining productivity trends' },
            { type: 'success', icon: '✅', text: 'Engineering team productivity +12% this month' },
            { type: 'info', icon: '💡', text: 'Remote workers 8% more productive than office' },
            { type: 'warning', icon: '⚠️', text: 'Tuesday has lowest task completion rate' },
          ].map((ins, i) => (
            <div key={i} style={{
              padding: 12, borderRadius: 8, marginBottom: 8,
              background: ins.type === 'warning' ? '#fef3c7' : ins.type === 'success' ? '#dcfce7' : '#dbeafe'
            }}>
              <p style={{ fontSize: 13, margin: 0, color: ins.type === 'warning' ? '#b45309' : ins.type === 'success' ? '#15803d' : '#1d4ed8' }}>
                {ins.icon} {ins.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

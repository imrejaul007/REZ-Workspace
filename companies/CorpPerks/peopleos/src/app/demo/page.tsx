'use client';

import { useState } from 'react';

const metrics = [
  { label: 'Employee Retention', value: '94%', change: '+5%', positive: true },
  { label: 'Attendance Rate', value: '97%', change: '+3%', positive: true },
  { label: 'Attrition Prevented', value: '12', change: 'AI predicted', positive: true },
  { label: 'Engagement Score', value: '87', change: '+12', positive: true },
];

const predictions = [
  { name: 'Priya Sharma', risk: 'High', score: 85, factors: ['Late nights', 'No promotion 18mo', 'Peer attrition'], action: 'Schedule 1:1' },
  { name: 'Rahul Verma', risk: 'Medium', score: 62, factors: ['Salary concern', 'Workload'], action: 'Review compensation' },
  { name: 'Sneha Patel', risk: 'Low', score: 15, factors: ['Recently promoted', 'Good reviews'], action: 'Recognition' },
];

const features = [
  { name: 'AI Attrition Prediction', desc: 'Predicts which employees might leave 3 months in advance', impact: '+45% retention' },
  { name: 'Geo-Fence Attendance', desc: 'Smart location-based attendance with QR verification', impact: '+25% accuracy' },
  { name: 'WhatsApp HR Bot', desc: 'Employees manage attendance, leaves, payslips via WhatsApp', impact: '+60% engagement' },
  { name: 'Burnout Detection', desc: 'AI monitors workload and stress signals', impact: '+30% wellness' },
  { name: 'Intent Graph', desc: 'Tracks career intent and growth signals', impact: '+40% internal mobility' },
  { name: 'Smart Benefits Wallet', desc: 'AI recommends optimal benefit allocation', impact: '+35% satisfaction' },
];

export default function DemoPage() {
  const [timeRange, setTimeRange] = useState('30d');

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Interactive Demo Dashboard</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>AI-Powered Workforce OS in action</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
          <button style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Share Demo
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: 24, borderRadius: 16, color: 'white' }}>
            <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>{m.label}</p>
            <p style={{ fontSize: 36, fontWeight: 700, margin: '8px 0' }}>{m.value}</p>
            <p style={{ fontSize: 12, opacity: 0.9, margin: 0 }}>{m.change}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* AI Predictions */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px' }}>🔮 AI Attrition Predictions</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
            Our AI predicts which employees might leave - enabling proactive retention
          </p>
          {predictions.map(p => (
            <div key={p.name} style={{ padding: 16, background: '#f9fafb', borderRadius: 12, marginBottom: 12, borderLeft: p.risk === 'High' ? '4px solid #ef4444' : p.risk === 'Medium' ? '4px solid #f59e0b' : '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <p style={{ fontWeight: 600, margin: 0 }}>{p.name}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Risk Score: {p.score}%</p>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: p.risk === 'High' ? '#fee2e2' : p.risk === 'Medium' ? '#fef3c7' : '#dcfce7',
                  color: p.risk === 'High' ? '#dc2626' : p.risk === 'Medium' ? '#b45309' : '#15803d'
                }}>
                  {p.risk} Risk
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                {p.factors.map((f, i) => (
                  <span key={i} style={{ padding: '2px 8px', background: '#fee2e2', color: '#dc2626', borderRadius: 10, fontSize: 11 }}>⚠️ {f}</span>
                ))}
              </div>
              <button style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                {p.action}
              </button>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px' }}>Try It Now</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '📱', label: 'Send WhatsApp Command', action: '!attendance' },
              { icon: '📊', label: 'View AI Insights', action: 'Generate Report' },
              { icon: '✅', label: 'Test Geo-Fence', action: 'Mark Attendance' },
              { icon: '💰', label: 'Check Wallet Balance', action: 'View Benefits' },
            ].map(a => (
              <button key={a.label} style={{
                padding: 16, background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: 12, cursor: 'pointer', textAlign: 'left'
              }}>
                <span style={{ fontSize: 20, marginRight: 12 }}>{a.icon}</span>
                <span style={{ fontWeight: 600 }}>{a.label}</span>
                <span style={{ float: 'right', fontSize: 12, color: '#8b5cf6' }}>{a.action} →</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, marginTop: 24 }}>
        <h2 style={{ margin: '0 0 16px' }}>Key Differentiating Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {features.map(f => (
            <div key={f.name} style={{ padding: 20, background: '#f9fafb', borderRadius: 12 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>{f.name}</h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>{f.desc}</p>
              <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#15803d', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                {f.impact}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', padding: 32, borderRadius: 16, marginTop: 24, color: 'white', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 8px' }}>Ready to see more?</h2>
        <p style={{ opacity: 0.9, margin: '0 0 16px' }}>Book a personalized demo with our team</p>
        <button style={{ padding: '12px 32px', background: 'white', color: '#8b5cf6', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          Schedule Demo
        </button>
      </div>
    </div>
  );
}

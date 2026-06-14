'use client';

import { useState } from 'react';
import Link from 'next/link';

const aiFeatures = [
  {
    id: 'attrition',
    name: 'Attrition Predictor',
    icon: '🔮',
    service: 'REZ Predictive Engine',
    desc: 'Predict which employees might leave',
    status: 'active',
  },
  {
    id: 'burnout',
    name: 'Burnout Detection',
    icon: '🔥',
    service: 'REZ Predictive Engine',
    desc: 'Detect burnout risk early',
    status: 'active',
  },
  {
    id: 'intent',
    name: 'Intent Predictor',
    icon: '🎯',
    service: 'REZ Intent Graph',
    desc: 'Know employee career intent',
    status: 'active',
  },
  {
    id: 'signals',
    name: 'Signal Aggregator',
    icon: '📡',
    service: 'REZ Signal Service',
    desc: 'Track workforce signals',
    status: 'active',
  },
  {
    id: 'insights',
    name: 'AI Insights',
    icon: '🤖',
    service: 'REZ Insights Service',
    desc: 'Deep workforce analytics',
    status: 'active',
  },
  {
    id: 'recommend',
    name: 'Smart Training',
    icon: '📚',
    service: 'REZ Recommendations',
    desc: 'AI course recommendations',
    status: 'active',
  },
];

const employees = [
  { id: '1', name: 'Priya Sharma', risk: 'high', riskScore: 85, factors: ['Late nights', 'No promotion in 18mo', 'Peer left'] },
  { id: '2', name: 'Rahul Verma', risk: 'medium', riskScore: 55, factors: ['Salary discussion', 'Workload increase'] },
  { id: '3', name: 'Sneha Patel', risk: 'low', riskScore: 15, factors: ['Recently promoted', 'Good reviews'] },
  { id: '4', name: 'Amit Kumar', risk: 'high', riskScore: 78, factors: ['Remote work stress', 'Team changes'] },
];

const insights = [
  { type: 'warning', icon: '⚠️', text: '2 employees at high attrition risk' },
  { type: 'success', icon: '✅', text: 'Engineering team engagement up 15%' },
  { type: 'info', icon: '💡', text: '3 employees ready for promotion' },
  { type: 'warning', icon: '🔥', text: '1 employee showing burnout signals' },
];

export default function AIHubPage() {
  const [selectedEmployee, setSelectedEmployee] = useState(employees[0]);
  const [activeFeature, setActiveFeature] = useState('attrition');

  const getRiskColor = (risk: string) => {
    if (risk === 'high') return { bg: '#fee2e2', color: '#dc2626' };
    if (risk === 'medium') return { bg: '#fef3c7', color: '#b45309' };
    return { bg: '#dcfce7', color: '#15803d' };
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>🤖 AI Intelligence Hub</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>Powered by REZ Intelligence - 38 AI agents</p>
        </div>
        <Link
          href="/insights"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
            color: 'white',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          <span>🚀</span>
          New AI Dashboard
        </Link>
      </div>

      {/* AI Services Connected */}
      <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', padding: 24, borderRadius: 16, color: 'white', marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>REZ Intelligence Services Connected</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {['Intent Predictor', 'Predictive Engine', 'Signal Aggregator', 'Insights Service', 'Recommendation Engine', 'Career Graph'].map(service => (
            <div key={service} style={{ background: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
              <span style={{ fontSize: 24 }}>✅</span>
              <p style={{ fontSize: 13, margin: '8px 0 0' }}>{service}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Features */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ marginBottom: 16 }}>AI Features</h2>
          {aiFeatures.map(feature => (
            <div
              key={feature.id}
              onClick={() => setActiveFeature(feature.id)}
              style={{
                padding: 16,
                background: activeFeature === feature.id ? '#f3f4f6' : 'transparent',
                borderRadius: 8,
                marginBottom: 8,
                cursor: 'pointer',
                border: activeFeature === feature.id ? '2px solid #8b5cf6' : '2px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{feature.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, margin: 0 }}>{feature.name}</p>
                  <p style={{ fontSize: 12, color: '#8b5cf6', margin: 0 }}>{feature.service}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Analysis */}
        <div>
          {/* Risk Overview */}
          <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h2 style={{ marginBottom: 16 }}>🔮 Attrition Risk Analysis</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['High Risk', 'Medium Risk', 'Low Risk'].map(r => (
                <span key={r} style={{
                  padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                  background: r === 'High Risk' ? '#fee2e2' : r === 'Medium Risk' ? '#fef3c7' : '#dcfce7',
                  color: r === 'High Risk' ? '#dc2626' : r === 'Medium Risk' ? '#b45309' : '#15803d',
                }}>
                  {r}: {employees.filter(e => e.risk === r.toLowerCase()).length}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {employees.map(emp => {
                const riskColors = getRiskColor(emp.risk);
                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    style={{
                      padding: 16,
                      background: selectedEmployee.id === emp.id ? '#f3f4f6' : '#f9fafb',
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: selectedEmployee.id === emp.id ? '2px solid #8b5cf6' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%', background: '#8b5cf6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 600,
                      }}>
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, margin: 0 }}>{emp.name}</p>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
                          Risk Score: <strong style={{ color: riskColors.color }}>{emp.riskScore}%</strong>
                        </p>
                      </div>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                        background: riskColors.bg, color: riskColors.color,
                      }}>
                        {emp.risk.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Employee Details */}
          <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
            <h2 style={{ marginBottom: 16 }}>AI Analysis: {selectedEmployee.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 8px' }}>Risk Score</p>
                <p style={{ fontSize: 32, fontWeight: 700, margin: 0, color: getRiskColor(selectedEmployee.risk).color }}>
                  {selectedEmployee.riskScore}%
                </p>
              </div>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 8px' }}>Risk Level</p>
                <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: getRiskColor(selectedEmployee.risk).color }}>
                  {selectedEmployee.risk.toUpperCase()}
                </p>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Risk Factors (AI Detected:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selectedEmployee.factors.map((factor, i) => (
                  <span key={i} style={{
                    padding: '6px 12px', background: '#fef3c7', color: '#b45309',
                    borderRadius: 20, fontSize: 12,
                  }}>
                    ⚠️ {factor}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16, background: '#f0fdf4', padding: 16, borderRadius: 8, borderLeft: '4px solid #10b981' }}>
              <p style={{ fontWeight: 600, color: '#15803d', margin: '0 0 8px' }}>AI Recommendations:</p>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#166534', fontSize: 13 }}>
                <li>Schedule 1:1 meeting this week</li>
                <li>Consider promotion discussion</li>
                <li>Assign mentoring opportunity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Feed */}
      <div style={{ marginTop: 24, background: 'white', borderRadius: 12, padding: 24 }}>
        <h2 style={{ marginBottom: 16 }}>📊 AI Insights Feed</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {insights.map((insight, i) => (
            <div key={i} style={{
              padding: 16, borderRadius: 8,
              background: insight.type === 'warning' ? '#fef3c7' :
                           insight.type === 'success' ? '#dcfce7' : '#dbeafe',
            }}>
              <p style={{
                margin: 0, fontSize: 13,
                color: insight.type === 'warning' ? '#b45309' :
                       insight.type === 'success' ? '#15803d' : '#1d4ed8',
              }}>
                {insight.icon} {insight.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

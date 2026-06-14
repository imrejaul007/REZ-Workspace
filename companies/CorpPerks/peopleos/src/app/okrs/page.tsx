'use client';

import { useState } from 'react';

const okrs = [
  { id: '1', title: 'Launch new feature', type: 'company', progress: 75, quarter: 'Q2 2026' },
  { id: '2', title: 'Increase NPS by 20%', type: 'company', progress: 60, quarter: 'Q2 2026' },
];

const myOkrs = [
  { id: '1', title: 'Complete AWS certification', progress: 70, deadline: 'May 30' },
  { id: '2', title: 'Mentor 2 juniors', progress: 50, deadline: 'Jun 15' },
  { id: '3', title: 'Ship new dashboard', progress: 85, deadline: 'May 25' },
];

const keyResults = [
  { id: '1', title: 'Feature adoption rate', current: 45, target: 60, unit: '%' },
  { id: '2', title: 'Customer satisfaction', current: 4.2, target: 4.5, unit: '/5' },
  { id: '3', title: 'Sprint velocity', current: 32, target: 40, unit: 'points' },
];

export default function OKRsPage() {
  const [cycle, setCycle] = useState('Q2 2026');

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>OKRs</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>Objectives & Key Results</p>
        </div>
        <select value={cycle} onChange={(e) => setCycle(e.target.value)} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <option>Q2 2026</option>
          <option>Q1 2026</option>
        </select>
      </div>

      {/* Company OKRs */}
      <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', padding: 24, borderRadius: 16, color: 'white', marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 16px' }}>Company OKRs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {okrs.map(okr => (
            <div key={okr.id} style={{ background: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 12 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{okr.title}</p>
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.3)', borderRadius: 4 }}>
                  <div style={{ width: `${okr.progress}%`, height: '100%', background: 'white', borderRadius: 4 }} />
                </div>
                <p style={{ fontSize: 12, marginTop: 8 }}>{okr.progress}% complete</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My OKRs */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>My OKRs</h2>
          <button style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>+ Add OKR</button>
        </div>
        {myOkrs.map(okr => (
          <div key={okr.id} style={{ padding: 16, background: '#f9fafb', borderRadius: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>{okr.title}</span>
              <span style={{ color: '#6b7280', fontSize: 13 }}>Due: {okr.deadline}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                <div style={{ width: `${okr.progress}%`, height: '100%', background: '#10b981', borderRadius: 4 }} />
              </div>
              <span style={{ fontWeight: 600, color: '#10b981' }}>{okr.progress}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Key Results */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Key Results</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {keyResults.map(kr => (
            <div key={kr.id} style={{ padding: 20, background: '#f9fafb', borderRadius: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{kr.title}</p>
              <p style={{ fontSize: 32, fontWeight: 700, color: '#8b5cf6', margin: '8px 0' }}>
                {kr.current}<span style={{ fontSize: 16 }}>{kr.unit}</span>
              </p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Target: {kr.target}{kr.unit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

const candidates = [
  { id: '1', name: 'Priya Sharma', role: 'React Developer', stage: 1, match: 92, updated: '2 hours ago' },
  { id: '2', name: 'Rahul Verma', role: 'Backend Engineer', stage: 2, match: 88, updated: '1 day ago' },
  { id: '3', name: 'Sneha Patel', role: 'Product Designer', stage: 3, match: 85, updated: '3 days ago' },
];

export default function CandidatePortal() {
  const [activeCandidate, setActiveCandidate] = useState(candidates[0]);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Candidate Portal</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Track your application status</p>

      {/* Progress Tracker */}
      <div style={{ background: 'white', padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Your Application Progress</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {stages.map((stage, i) => (
            <div key={stage} style={{ textAlign: 'center', position: 'relative', flex: 1 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', margin: '0 auto 8px',
                background: i <= 1 ? '#10b981' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: i <= 1 ? 'white' : '#6b7280', fontWeight: 600
              }}>
                {i < 1 ? '✓' : i + 1}
              </div>
              <p style={{ fontSize: 13, fontWeight: 500 }}>{stage}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Application Status */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ marginBottom: 16 }}>Active Applications</h2>
          {candidates.map(c => (
            <div
              key={c.id}
              onClick={() => setActiveCandidate(c)}
              style={{
                padding: 16, borderRadius: 12, marginBottom: 8, cursor: 'pointer',
                background: activeCandidate.id === c.id ? '#f3f4f6' : 'transparent',
                border: activeCandidate.id === c.id ? '2px solid #8b5cf6' : 'none'
              }}
            >
              <p style={{ fontWeight: 600, margin: 0 }}>{c.name}</p>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0' }}>{c.role}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ padding: '4px 8px', background: '#dcfce7', color: '#15803d', borderRadius: 10, fontSize: 11 }}>{c.match}% match</span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{c.updated}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ marginBottom: 16 }}>Activity Timeline</h2>
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            {[
              { title: 'Application Received', time: 'May 10, 2026', status: 'done' },
              { title: 'Resume Shortlisted', time: 'May 12, 2026', status: 'done' },
              { title: 'Phone Screening Scheduled', time: 'May 20, 2026', status: 'current' },
              { title: 'Technical Interview', time: 'Pending', status: 'pending' },
              { title: 'Offer Letter', time: 'Pending', status: 'pending' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 24, position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: -8, width: 16, height: 16, borderRadius: '50%',
                  background: item.status === 'done' ? '#10b981' : item.status === 'current' ? '#8b5cf6' : '#e5e7eb'
                }} />
                <div style={{ flex: 1, paddingBottom: i < 4 ? 24 : 0, borderBottom: i < 4 ? '1px dashed #e5e7eb' : 'none' }}>
                  <p style={{ fontWeight: 600, margin: 0 }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

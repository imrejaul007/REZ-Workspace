'use client';

import { useState } from 'react';

const articles = [
  { id: 1, title: 'Getting Started', category: 'Basics', icon: '🚀' },
  { id: 2, title: 'Setting up Geo-Fence', category: 'Attendance', icon: '📍' },
  { id: 3, title: 'Configuring OKRs', category: 'Performance', icon: '🎯' },
  { id: 4, title: 'WhatsApp Bot Commands', category: 'Communication', icon: '💬' },
  { id: 5, title: 'Payroll Setup Guide', category: 'Finance', icon: '💰' },
  { id: 6, title: 'Integrating REZ Wallet', category: 'Integrations', icon: '🔗' },
];

const categories = ['All', 'Basics', 'Attendance', 'Performance', 'Finance', 'Integrations'];

export default function HelpPage() {
  const [active, setActive] = useState('All');

  const filtered = active === 'All' ? articles : articles.filter(a => a.category === active);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Help Center</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Find answers to common questions</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setActive(c)} style={{
            padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 500,
            background: active === c ? '#8b5cf6' : '#e5e7eb', color: active === c ? 'white' : '#6b7280'
          }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {filtered.map(a => (
          <div key={a.id} style={{ background: 'white', padding: 24, borderRadius: 12, cursor: 'pointer' }}>
            <span style={{ fontSize: 32 }}>{a.icon}</span>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '12px 0 4px' }}>{a.title}</h3>
            <p style={{ fontSize: 13, color: '#8b5cf6', margin: 0 }}>{a.category}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#f9fafb', padding: 24, borderRadius: 12, marginTop: 32, textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 8px' }}>Still need help?</h2>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>Contact our support team</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button style={{ padding: '12px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Chat Support</button>
          <button style={{ padding: '12px 24px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>Email Support</button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

const checks = [
  { id: '1', name: 'PF Registration', category: 'Compliance', status: 'done', date: 'Jan 2026' },
  { id: '2', name: 'ESI Registration', category: 'Compliance', status: 'done', date: 'Jan 2026' },
  { id: '3', name: 'Professional Tax', category: 'Tax', status: 'pending', due: 'May 31' },
  { id: '4', name: 'TDS Filing', category: 'Tax', status: 'pending', due: 'Jun 7' },
  { id: '5', name: 'Shops Act License', category: 'License', status: 'expiring', due: 'Dec 2026' },
  { id: '6', name: 'GST Filing', category: 'Tax', status: 'done', date: 'Monthly' },
];

export default function CompliancePage() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? checks : checks.filter(c => c.status === filter);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>📋 Compliance</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Track regulatory compliance and deadlines</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Completed', value: '3', color: '#10b981' },
          { label: 'Pending', value: '2', color: '#f59e0b' },
          { label: 'Expiring', value: '1', color: '#ef4444' },
          { label: 'Audits', value: '1', color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <p style={{ fontSize: 32, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['all', 'done', 'pending', 'expiring'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 500,
            background: filter === f ? '#10b981' : '#e5e7eb', color: filter === f ? 'white' : '#6b7280',
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
        {filtered.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: 24 }}>{
              c.category === 'Tax' ? '📊' : c.category === 'Compliance' ? '✅' : '📄'
            }</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, margin: 0 }}>{c.name}</p>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{c.category}</p>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: c.status === 'done' ? '#dcfce7' : c.status === 'pending' ? '#fef3c7' : '#fee2e2',
              color: c.status === 'done' ? '#15803d' : c.status === 'pending' ? '#b45309' : '#dc2626',
            }}>
              {c.status === 'done' ? '✅ Done' : c.status === 'pending' ? `⏳ Due: ${c.due}` : `⚠️ Expiring: ${c.due}`}
            </span>
            <button style={{ padding: '8px 16px', background: c.status === 'done' ? '#e5e7eb' : '#10b981', color: c.status === 'done' ? '#6b7280' : 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              {c.status === 'done' ? 'View' : 'File Now'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

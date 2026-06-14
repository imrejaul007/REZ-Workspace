'use client';

import { useState } from 'react';

const visitors = [
  { id: '1', name: 'Rajesh Kumar', email: 'rajesh@vendor.com', host: 'Priya Sharma', purpose: 'Meeting', checkIn: '10:30 AM', status: 'checked-in' },
  { id: '2', name: 'Amit Singh', email: 'amit@client.com', host: 'Rahul Verma', purpose: 'Interview', checkIn: '11:00 AM', status: 'pending' },
];

export default function VisitorPage() {
  const [showQR, setShowQR] = useState(false);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Visitor Management</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Track visitors and gate passes</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Today Visitors', value: 12 },
          { label: 'Checked In', value: 8 },
          { label: 'Pending', value: 4 },
          { label: 'Active Passes', value: 3 },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 16px' }}>Pre-register Visitor</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input placeholder="Visitor Name" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
          <input placeholder="Email" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
          <input placeholder="Host Employee" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
          <select style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <option>Meeting</option>
            <option>Interview</option>
            <option>Delivery</option>
            <option>Vendor</option>
          </select>
        </div>
        <button style={{ marginTop: 16, padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          Register & Send QR
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
        <h2 style={{ margin: '0 0 16px' }}>Today&apos;s Visitors</h2>
        {visitors.map(v => (
          <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: 32 }}>👤</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, margin: 0 }}>{v.name}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Host: {v.host} • {v.purpose}</p>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, background: v.status === 'checked-in' ? '#dcfce7' : '#fef3c7', color: v.status === 'checked-in' ? '#15803d' : '#b45309' }}>
              {v.status === 'checked-in' ? 'Checked In' : 'Pending'}
            </span>
            <button style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Generate Pass</button>
          </div>
        ))}
      </div>
    </div>
  );
}

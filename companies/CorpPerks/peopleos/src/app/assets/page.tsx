'use client';

import { useState } from 'react';

const assets = [
  { id: '1', name: 'MacBook Pro 16"', type: 'Laptop', assigned: 'Priya Sharma', status: 'assigned', condition: 'Good' },
  { id: '2', name: 'Dell Monitor 27"', type: 'Monitor', assigned: 'Rahul Verma', status: 'assigned', condition: 'New' },
  { id: '3', name: 'iPhone 14', type: 'Mobile', assigned: 'Unassigned', status: 'available', condition: 'New' },
  { id: '4', name: 'HP Laptop', type: 'Laptop', assigned: 'Sneha Patel', status: 'assigned', condition: 'Repair needed' },
];

export default function AssetsPage() {
  const [filter, setFilter] = useState('all');

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Asset Management</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Track company assets and equipment</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Assets', value: 156, icon: '💻' },
          { label: 'Assigned', value: 142, icon: '✅' },
          { label: 'Available', value: 14, icon: '📦' },
          { label: 'Maintenance', value: 5, icon: '🔧' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 32 }}>{s.icon}</span>
            <p style={{ fontSize: 28, fontWeight: 700, margin: '8px 0 0' }}>{s.value}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, overflow: 'auto' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0 }}>Assets</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
            <th style={{ padding: 12, textAlign: 'left', color: '#6b7280' }}>Asset</th>
            <th style={{ padding: 12, textAlign: 'left', color: '#6b7280' }}>Type</th>
            <th style={{ padding: 12, textAlign: 'left', color: '#6b7280' }}>Assigned To</th>
            <th style={{ padding: 12, textAlign: 'left', color: '#6b7280' }}>Condition</th>
            <th style={{ padding: 12, textAlign: 'left', color: '#6b7280' }}>Status</th>
          </tr>
          </thead>
          <tbody>
          {assets.map(asset => (
            <tr key={asset.id} style={{ borderTop: '1px solid #e5e7eb' }}>
            <td style={{ padding: 16 }}>{asset.name}</td>
            <td style={{ padding: 16, color: '#6b7280' }}>{asset.type}</td>
            <td style={{ padding: 16 }}>{asset.assigned}</td>
            <td style={{ padding: 16, color: asset.condition === 'Repair needed' ? '#ef4444' : '#6b7280' }}>{asset.condition}</td>
            <td style={{ padding: 16 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: asset.status === 'assigned' ? '#dcfce7' : '#e5e7eb',
                color: asset.status === 'assigned' ? '#15803d' : '#6b7280'
              }}>
                {asset.status}
              </span>
            </td>
          </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

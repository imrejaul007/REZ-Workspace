'use client';

import { useState } from 'react';

const docs = [
  { id: '1', name: 'Offer Letter - Priya Sharma', type: 'offer', date: 'May 10, 2026', status: 'signed' },
  { id: '2', name: 'NDA - Rahul Verma', type: 'nda', date: 'May 12, 2026', status: 'pending' },
  { id: '3', name: 'Employee Handbook', type: 'policy', date: 'Jan 1, 2026', status: 'signed' },
  { id: '4', name: 'Benefits Agreement', type: 'benefits', date: 'May 15, 2026', status: 'pending' },
  { id: '5', name: 'Tax Form 16', type: 'tax', date: 'Apr 30, 2026', status: 'signed' },
];

const types = {
  offer: { label: 'Offer', icon: '📄', color: '#8b5cf6' },
  nda: { label: 'NDA', icon: '🔒', color: '#ef4444' },
  policy: { label: 'Policy', icon: '📋', color: '#3b82f6' },
  benefits: { label: 'Benefits', icon: '🎁', color: '#10b981' },
  tax: { label: 'Tax', icon: '📊', color: '#f59e0b' },
};

export default function DocumentsPage() {
  const [filter, setFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);

  const filtered = filter === 'all' ? docs : docs.filter(d => d.type === filter);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>📄 Documents</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Employee documents and contracts</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          + Upload Document
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setFilter('all')}
          style={{ padding: '8px 16px', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 500, background: filter === 'all' ? '#10b981' : '#e5e7eb', color: filter === 'all' ? 'white' : '#6b7280' }}
        >
          All ({docs.length})
        </button>
        {Object.entries(types).map(([key, val]: [string, any]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{ padding: '8px 16px', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 500, background: filter === key ? val.color : '#e5e7eb', color: filter === key ? 'white' : '#6b7280' }}
          >
            {val.icon} {docs.filter(d => d.type === key).length} {val.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(doc => {
          const type = types[doc.type as keyof typeof types];
          return (
            <div
              key={doc.id}
              style={{ background: 'white', padding: 20, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${type.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 24 }}>{type.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, margin: 0 }}>{doc.name}</p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{type.label} • {doc.date}</p>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: doc.status === 'signed' ? '#dcfce7' : '#fef3c7', color: doc.status === 'signed' ? '#15803d' : '#b45309'
              }}>
                {doc.status === 'signed' ? '✅ Signed' : '⏳ Pending Signature'}
              </span>
              <button style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                {doc.status === 'signed' ? 'Download' : 'Sign Now'}
              </button>
            </div>
          );
        })}
      </div>

      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 16, width: 500 }}>
            <h2 style={{ marginTop: 0 }}>Upload Document</h2>
            <div style={{ border: '2px dashed #d1d5db', borderRadius: 12, padding: 40, textAlign: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 48 }}>📤</span>
              <p style={{ color: '#6b7280' }}>Drop files here or click to upload</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowUpload(false)}
                style={{ flex: 1, padding: 12, background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowUpload(false)}
                style={{ flex: 1, padding: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

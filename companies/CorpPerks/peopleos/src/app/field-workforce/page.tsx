'use client';

import { useState } from 'react';

const fieldWorkers = [
  { id: 1, name: 'Rajesh Kumar', role: 'Field Sales', location: 'Mumbai South', status: 'active', tasks: 5, completed: 3, lat: 19.0760, lng: 72.8777 },
  { id: 2, name: 'Priya Singh', role: 'Field Exec', location: 'Delhi NCR', status: 'active', tasks: 8, completed: 6, lat: 28.6139, lng: 77.2090 },
  { id: 3, name: 'Amit Sharma', role: 'Service Tech', location: 'Bangalore East', status: 'idle', tasks: 4, completed: 4, lat: 12.9716, lng: 77.5946 },
  { id: 4, name: 'Neha Reddy', role: 'Field Sales', location: 'Hyderabad', status: 'active', tasks: 6, completed: 2, lat: 17.3850, lng: 78.4867 },
];

const checkIns = [
  { name: 'Rajesh Kumar', time: '9:05 AM', location: 'Andheri West', status: 'on-time' },
  { name: 'Priya Singh', time: '9:15 AM', location: 'Connaught Place', status: 'late' },
  { name: 'Amit Sharma', time: '8:45 AM', location: 'Whitefield', status: 'early' },
  { name: 'Neha Reddy', time: '9:30 AM', location: 'Jubilee Hills', status: 'late' },
];

export default function FieldWorkforcePage() {
  const [view, setView] = useState('map');

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Field Workforce</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Real-time GPS tracking of field employees</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Active Workers', value: 24, icon: '📍', color: '#10b981' },
          { label: 'On-site', value: 18, icon: '✅', color: '#10b981' },
          { label: 'Idle', value: 4, icon: '⏸️', color: '#f59e0b' },
          { label: 'Tasks Done', value: '89%', icon: '📋', color: '#8b5cf6' },
        ].map(m => (
          <div key={m.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 24 }}>{m.icon}</span>
            <p style={{ fontSize: 28, fontWeight: 700, color: m.color, margin: '8px 0 0' }}>{m.value}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{m.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['map', 'list', 'timeline'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500,
            background: view === v ? '#8b5cf6' : '#e5e7eb', color: view === v ? 'white' : '#6b7280'
          }}>
            {v === 'map' ? '🗺️ Map' : v === 'list' ? '📋 List' : '📍 Timeline'}
          </button>
        ))}
      </div>

      {view === 'map' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <div style={{ height: 400, background: '#f3f4f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 48 }}>🗺️</span>
              <p style={{ margin: '16px 0 0', fontSize: 18, fontWeight: 600 }}>Live Map View</p>
              <p style={{ margin: 0, color: '#6b7280' }}>GPS tracking of all field workers</p>
              <p style={{ margin: '4px 0 0', color: '#6b7280' }}>Click markers for details</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {fieldWorkers.map(w => (
              <div key={w.id} style={{
                padding: '12px 16px', background: w.status === 'active' ? '#dcfce7' : '#fef3c7',
                borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span style={{ fontSize: 16 }}>{w.status === 'active' ? '📍' : '⏸️'}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{w.name}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>({w.location})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'list' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px' }}>Field Workers</h2>
          {fieldWorkers.map(w => (
            <div key={w.id} style={{
              padding: 16, background: '#f9fafb', borderRadius: 12, marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 16
            }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                {w.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, margin: 0 }}>{w.name}</p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{w.role} • {w.location}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: w.status === 'active' ? '#dcfce7' : '#fef3c7',
                  color: w.status === 'active' ? '#15803d' : '#b45309'
                }}>
                  {w.status === 'active' ? '📍 Active' : '⏸️ Idle'}
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, margin: 0 }}>{w.completed}/{w.tasks}</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>tasks</p>
              </div>
              <button style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                Track
              </button>
            </div>
          ))}
        </div>
      )}

      {view === 'timeline' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px' }}>Today&apos;s Check-ins</h2>
          {checkIns.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: 16, background: '#f9fafb', borderRadius: 12, marginBottom: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: c.status === 'on-time' ? '#dcfce7' : c.status === 'early' ? '#dcfce7' : '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
              }}>
                {c.status === 'on-time' ? '✅' : c.status === 'early' ? '🌟' : '⏰'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, margin: 0 }}>{c.name}</p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{c.location}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 600, margin: 0 }}>{c.time}</p>
                <p style={{ fontSize: 12, color: c.status === 'on-time' ? '#15803d' : '#dc2626', margin: '4px 0 0' }}>
                  {c.status === 'on-time' ? 'On Time' : c.status === 'early' ? 'Early' : 'Late'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

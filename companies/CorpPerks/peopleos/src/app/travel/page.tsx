'use client';

import { useState } from 'react';

const rides = [
  { id: '1', date: 'May 16', pickup: 'Home', dropoff: 'Office', fare: 150, status: 'completed' },
  { id: '2', date: 'May 15', pickup: 'Office', dropoff: 'Client Meeting', fare: 320, status: 'completed' },
  { id: '3', date: 'May 17', pickup: 'Home', dropoff: 'Office', fare: 0, status: 'pending' },
];

export default function TravelPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>🚗 Travel</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Track commute and business travel via REZ Ride</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'This Month', value: '₹4,250', icon: '💰' },
          { label: 'Pending', value: '₹0', icon: '⏳' },
          { label: 'Completed', value: '₹4,250', icon: '✅' },
          { label: 'CO₂ Saved', value: '12 kg', icon: '🌱' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <p style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 0', color: '#10b981' }}>{s.value}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Book Ride</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <input placeholder="Pickup location" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
          <input placeholder="Drop location" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, flex: 1 }}>
            <option>Today, 9:00 AM</option>
            <option>Tomorrow, 9:00 AM</option>
          </select>
          <button style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            Book via REZ Ride
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Recent Rides</h2>
        {rides.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🚗</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, margin: 0 }}>{r.pickup} → {r.dropoff}</p>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{r.date}</p>
            </div>
            <span style={{ fontWeight: 600, color: '#10b981' }}>{r.status === 'pending' ? 'Pending' : `₹${r.fare}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

const celebrations = [
  { icon: '🎂', name: 'Rahul Singh', detail: 'Birthday today!', date: 'Today' },
  { icon: '🎉', name: '2 Year Anniversary', detail: 'Celebrating 2 years!', date: 'May 20' },
  { icon: '🚀', name: 'Priya Sharma', detail: 'Promoted to Senior Engineer', date: 'May 15' },
];

export default function CulturePage() {
  const [mood, setMood] = useState(null);
  const moods = ['😊', '🙂', '😐', '😔', '😤'];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Culture & Pulse</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Monitor team health and celebrate wins</p>

      <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', padding: 24, borderRadius: 16, color: 'white', marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 16px' }}>How are you feeling today?</h2>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {moods.map((m, i) => (
            <button
              key={i}
              onClick={() => setMood(i)}
              style={{
                padding: 16, background: mood === i ? 'white' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, cursor: 'pointer', textAlign: 'center'
              }}
            >
              <span style={{ fontSize: 32 }}>{m}</span>
            </button>
          ))}
        </div>
        {mood !== null && <p style={{ textAlign: 'center', marginTop: 16, opacity: 0.9 }}>Thanks for sharing!</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 12 }}>
          <span style={{ fontSize: 24 }}>😊</span>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#10b981', margin: '8px 0 0' }}>78%</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Avg Mood</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12 }}>
          <span style={{ fontSize: 24 }}>🎉</span>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6', margin: '8px 0 0' }}>12</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Celebrations</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12 }}>
          <span style={{ fontSize: 24 }}>🏆</span>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b', margin: '8px 0 0' }}>89</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Recognitions</p>
        </div>
      </div>

      <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
        <h3 style={{ margin: '0 0 16px' }}>Upcoming Celebrations</h3>
        {celebrations.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderBottom: i < celebrations.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
            <span style={{ fontSize: 32 }}>{c.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, margin: 0 }}>{c.name}</p>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{c.detail}</p>
            </div>
            <span style={{ fontSize: 12, color: '#8b5cf6' }}>{c.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

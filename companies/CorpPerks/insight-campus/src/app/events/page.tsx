'use client';

import { useState } from 'react';

const events = [
  { id: '1', title: 'Tech Career Fair 2026', date: 'May 25', time: '10:00 AM', location: 'Main Campus', attendees: 500, type: 'placement' },
  { id: '2', title: 'Resume Workshop', date: 'May 20', time: '2:00 PM', location: 'Online', attendees: 150, type: 'workshop' },
  { id: '3', title: 'Google Tech Talk', date: 'May 22', time: '4:00 PM', location: 'Seminar Hall A', attendees: 200, type: 'tech_talk' },
  { id: '4', title: 'Startup Pitch Day', date: 'May 28', time: '11:00 AM', location: 'Innovation Hub', attendees: 100, type: 'startup' },
];

export default function EventsPage() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>📅 Events</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Campus events, job fairs, and workshops</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['all', 'placement', 'workshop', 'tech_talk'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 500,
            background: filter === f ? '#8b5cf6' : '#e5e7eb', color: filter === f ? 'white' : '#6b7280',
          }}>
            {f === 'all' ? 'All' : f === 'placement' ? '💼 Placement' : f === 'workshop' ? '🎓 Workshop' : '💡 Tech Talk'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {filtered.map(event => (
          <div key={event.id} style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ height: 100, background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 48 }}>
                {event.type === 'placement' ? '💼' : event.type === 'workshop' ? '🎓' : event.type === 'tech_talk' ? '💡' : '🚀'}
              </span>
            </div>
            <div style={{ padding: 16 }}>
              <h3 style={{ margin: 0 }}>{event.title}</h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0' }}>{event.date} • {event.time}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 12px' }}>📍 {event.location}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>👥 {event.attendees} registered</span>
                <button style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Register
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

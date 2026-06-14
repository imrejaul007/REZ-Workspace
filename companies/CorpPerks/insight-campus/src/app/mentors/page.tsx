'use client';

import { useState } from 'react';

const mentors = [
  { id: '1', name: 'Priya Sharma', role: 'Senior Engineer', company: 'Google', expertise: ['React', 'Node.js', 'System Design'], sessions: 45, rating: 4.9 },
  { id: '2', name: 'Rahul Verma', role: 'Product Manager', company: 'Amazon', expertise: ['Product Strategy', 'Analytics'], sessions: 32, rating: 4.8 },
  { id: '3', name: 'Sneha Patel', role: 'UX Lead', company: 'Microsoft', expertise: ['UI/UX', 'Figma', 'Research'], sessions: 28, rating: 4.7 },
  { id: '4', name: 'Amit Kumar', role: 'Data Scientist', company: 'Netflix', expertise: ['Python', 'ML', 'AI'], sessions: 40, rating: 4.9 },
];

export default function MentorsPage() {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>🎓 Mentors</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Connect with industry experts</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {mentors.map(mentor => (
          <div key={mentor.id} onClick={() => setSelected(mentor)} style={{
            background: 'white', padding: 20, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
            border: selected?.id === mentor.id ? '2px solid #8b5cf6' : 'none',
          }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 28, fontWeight: 700 }}>
              {mentor.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h3 style={{ margin: 0, fontSize: 16 }}>{mentor.name}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0' }}>{mentor.role}</p>
            <p style={{ fontSize: 12, color: '#8b5cf6', margin: '0 0 8px' }}>{mentor.company}</p>
            <p style={{ fontSize: 12, color: '#f59e0b', margin: 0 }}>⭐ {mentor.rating} ({mentor.sessions} sessions)</p>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0 }}>{selected.name}</h2>
              <p style={{ color: '#6b7280', margin: '4px 0 0' }}>{selected.role} at {selected.company}</p>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
          </div>
          <h3 style={{ marginBottom: 8 }}>Expertise</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {selected.expertise.map(skill => (
              <span key={skill} style={{ padding: '6px 12px', background: '#f3f4f6', borderRadius: 20, fontSize: 13 }}>{skill}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={{ flex: 1, padding: 12, background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              Book Session
            </button>
            <button style={{ flex: 1, padding: 12, background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              Send Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

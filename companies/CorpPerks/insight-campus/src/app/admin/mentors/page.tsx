'use client';

import { useState } from 'react';

const mentors = [
  { id: '1', name: 'Priya Sharma', company: 'Google', role: 'Senior Engineer', expertise: ['React', 'System Design'], sessions: 45, rating: 4.9 },
  { id: '2', name: 'Rahul Verma', company: 'Amazon', role: 'Product Manager', expertise: ['Strategy', 'Analytics'], sessions: 32, rating: 4.8 },
  { id: '3', name: 'Sneha Patel', company: 'Microsoft', role: 'UX Lead', expertise: ['UI/UX', 'Figma'], sessions: 28, rating: 4.7 },
];

export default function AdminMentors() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Mentors</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Manage industry mentors</p>
        </div>
        <button style={{ padding: '12px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          + Invite Mentor
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 12 }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 24 }}>
          {[
            { label: 'Total Mentors', value: 45, icon: '🎓' },
            { label: 'Sessions', value: 156, icon: '📹' },
            { label: 'Avg Rating', value: 4.7, icon: '⭐' },
            { label: 'Students Helped', value: 890, icon: '👨‍🎓' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6', margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Mentor</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Company</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Expertise</th>
              <th style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>Sessions</th>
              <th style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>Rating</th>
              <th style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mentors.map(m => (
              <tr key={m.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 18 }}>
                      {m.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, margin: 0 }}>{m.name}</p>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{m.role}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: 16, color: '#8b5cf6', fontWeight: 500 }}>{m.company}</td>
                <td style={{ padding: 16 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {m.expertise.map(e => (
                      <span key={e} style={{ padding: '4px 8px', background: '#f3f4f6', borderRadius: 10, fontSize: 11 }}>{e}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: 16, textAlign: 'center' }}>{m.sessions}</td>
                <td style={{ padding: 16, textAlign: 'center' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>⭐ {m.rating}</span>
                </td>
                <td style={{ padding: 16, textAlign: 'center' }}>
                  <button style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 8 }}>View</button>
                  <button style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

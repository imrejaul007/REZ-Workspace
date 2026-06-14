'use client';

import { useState } from 'react';

const interviews = [
  { id: '1', candidate: 'Priya Sharma', role: 'React Developer', date: 'May 20, 2026', time: '10:00 AM', type: 'video', status: 'scheduled' },
  { id: '2', candidate: 'Rahul Verma', role: 'Backend Engineer', date: 'May 21, 2026', time: '2:00 PM', type: 'phone', status: 'pending' },
  { id: '3', candidate: 'Sneha Patel', role: 'Product Manager', date: 'May 22, 2026', time: '11:00 AM', type: 'video', status: 'scheduled' },
];

export default function InterviewsPage() {
  const [showSchedule, setShowSchedule] = useState(false);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Video Interviews</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Conduct remote interviews via video/phone</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Scheduled', value: '12', icon: '📅', color: '#8b5cf6' },
          { label: 'Today', value: '3', icon: '🎥', color: '#10b981' },
          { label: 'Completed', value: '45', icon: '✅', color: '#06b6d4' },
          { label: 'Cancelled', value: '5', icon: '❌', color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: '8px 0 0' }}>{s.value}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Upcoming Interviews</h2>
        <button
          onClick={() => setShowSchedule(true)}
          style={{ padding: '12px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          + Schedule Interview
        </button>
      </div>

      {/* Interview List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {interviews.map(interview => (
          <div key={interview.id} style={{ background: 'white', padding: 24, borderRadius: 12, display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ minWidth: 100, textAlign: 'center' }}>
              <div style={{ background: interview.type === 'video' ? '#dcfce7' : '#dbeafe', padding: 16, borderRadius: 12 }}>
                <span style={{ fontSize: 32 }}>
                  {interview.type === 'video' ? '🎥' : '📞'}
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                {interview.type === 'video' ? 'Video Call' : 'Phone Call'}
              </p>
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0 }}>{interview.candidate}</h3>
              <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0' }}>{interview.role}</p>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, color: '#6b7280' }}>
                <span>📅 {interview.date}</span>
                <span>🕐 {interview.time}</span>
              </div>
            </div>

            <span style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              background: interview.status === 'scheduled' ? '#dcfce7' : '#fef3c7',
              color: interview.status === 'scheduled' ? '#15803d' : '#b45309',
            }}>
              {interview.status === 'scheduled' ? '🟢 Scheduled' : '🟡 Pending'}
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                Start Call
              </button>
              <button style={{ padding: '10px 16px', background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                Reschedule
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Modal */}
      {showSchedule && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 16, width: 500 }}>
            <h2 style={{ marginTop: 0 }}>Schedule Interview</h2>
            <input placeholder="Candidate Name" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }} />
            <input placeholder="Role" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }} />
            <select style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }}>
              <option>Video Call</option>
              <option>Phone Call</option>
            </select>
            <input type="date" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }} />
            <input type="time" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowSchedule(false)} style={{ flex: 1, padding: 12, background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button style={{ flex: 1, padding: 12, background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

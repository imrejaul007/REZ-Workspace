'use client';

import { useState } from 'react';

const shifts = [
  { id: '1', name: 'Morning Shift', time: '9:00 AM - 6:00 PM', count: 12 },
  { id: '2', name: 'Evening Shift', time: '2:00 PM - 11:00 PM', count: 8 },
  { id: '3', name: 'Night Shift', time: '10:00 PM - 7:00 AM', count: 4 },
];

const timesheets = [
  { id: '1', employee: 'Priya Sharma', date: 'May 16', checkIn: '9:05 AM', checkOut: '6:15 PM', hours: '9.2', status: 'approved' },
  { id: '2', employee: 'Rahul Verma', date: 'May 16', checkIn: '9:30 AM', checkOut: '6:45 PM', hours: '9.25', status: 'pending' },
  { id: '3', employee: 'Sneha Patel', date: 'May 16', checkIn: '8:55 AM', checkOut: '6:00 PM', hours: '9.08', status: 'approved' },
];

export default function TimePage() {
  const [tab, setTab] = useState('timesheets');

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>⏰ Time & Attendance</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Today Present', value: '42/45', icon: '✅' },
          { label: 'Late', value: '3', icon: '⏰' },
          { label: 'Overtime', value: '8 hrs', icon: '🕐' },
          { label: 'Avg Hours', value: '8.5 hrs', icon: '📊' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <p style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 0' }}>{s.value}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['timesheets', 'shifts', 'scheduling', 'overtime'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500,
            background: tab === t ? '#10b981' : '#e5e7eb', color: tab === t ? 'white' : '#6b7280',
          }}>
            {t === 'timesheets' ? 'Timesheets' : t === 'shifts' ? 'Shifts' : t === 'scheduling' ? 'Scheduling' : 'Overtime'}
          </button>
        ))}
      </div>

      {tab === 'timesheets' && (
        <div style={{ background: 'white', borderRadius: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Employee</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Check In</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Check Out</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Hours</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map(t => (
                <tr key={t.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 16 }}>{t.employee}</td>
                  <td style={{ padding: 16, color: '#6b7280' }}>{t.date}</td>
                  <td style={{ padding: 16 }}>{t.checkIn}</td>
                  <td style={{ padding: 16 }}>{t.checkOut}</td>
                  <td style={{ padding: 16, fontWeight: 600 }}>{t.hours} hrs</td>
                  <td style={{ padding: 16 }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                      background: t.status === 'approved' ? '#dcfce7' : '#fef3c7',
                      color: t.status === 'approved' ? '#15803d' : '#b45309',
                    }}>
                      {t.status === 'approved' ? '✅ Approved' : '⏳ Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'shifts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {shifts.map(s => (
            <div key={s.id} style={{ background: 'white', padding: 24, borderRadius: 12 }}>
              <h3 style={{ margin: '0 0 8px' }}>{s.name}</h3>
              <p style={{ color: '#6b7280', margin: '0 0 12px' }}>{s.time}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{s.count} employees</span>
                <button style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'scheduling' && (
        <div style={{ background: 'white', padding: 40, borderRadius: 12, textAlign: 'center' }}>
          <span style={{ fontSize: 48 }}>📅</span>
          <h2 style={{ margin: '16px 0 8px' }}>Auto Scheduling</h2>
          <p style={{ color: '#6b7280' }}>AI-powered shift scheduling coming soon</p>
        </div>
      )}

      {tab === 'overtime' && (
        <div style={{ background: 'white', padding: 40, borderRadius: 12, textAlign: 'center' }}>
          <span style={{ fontSize: 48 }}>🕐</span>
          <h2 style={{ margin: '16px 0 8px' }}>Overtime Tracking</h2>
          <p style={{ color: '#6b7280' }}>Track and approve overtime hours</p>
        </div>
      )}
    </div>
  );
}

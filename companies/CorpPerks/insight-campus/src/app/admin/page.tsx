'use client';

import { useState } from 'react';

const stats = [
  { label: 'Total Students', value: 1250, change: '+120', icon: '👨‍🎓' },
  { label: 'Active Courses', value: 85, change: '+15', icon: '📚' },
  { label: 'Mentors', value: 45, change: '+5', icon: '🎓' },
  { label: 'Placements', value: 234, change: '+28', icon: '💼' },
];

const recentActivity = [
  { type: 'student', text: 'New student registered: Priya Sharma', time: '2 min ago' },
  { type: 'course', text: 'New course added: Machine Learning', time: '15 min ago' },
  { type: 'mentor', text: 'Mentor joined: Rahul Verma', time: '1 hour ago' },
  { type: 'placement', text: 'Student placed at Google', time: '2 hours ago' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Admin Dashboard</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Manage your campus ecosystem</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 32 }}>{s.icon}</span>
              <span style={{ fontSize: 12, color: '#10b981', background: '#dcfce7', padding: '2px 8px', borderRadius: 10 }}>+{s.change}</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', margin: '12px 0 0' }}>{s.value}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
          <h2 style={{ marginBottom: 16 }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { icon: '👨‍🎓', label: 'Add Student' },
              { icon: '📚', label: 'Add Course' },
              { icon: '🎓', label: 'Add Mentor' },
              { icon: '💼', label: 'Post Job' },
              { icon: '📅', label: 'Create Event' },
              { icon: '📊', label: 'View Reports' },
              { icon: '📧', label: 'Send通知' },
              { icon: '⚙️', label: 'Settings' },
            ].map(action => (
              <button key={action.label} style={{
                padding: 16, background: '#f9fafb', border: 'none', borderRadius: 12, cursor: 'pointer', textAlign: 'center'
              }}>
                <span style={{ fontSize: 28, display: 'block' }}>{action.icon}</span>
                <span style={{ fontSize: 12, color: '#6b7280', marginTop: 8, display: 'block' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
          <h2 style={{ marginBottom: 16 }}>Recent Activity</h2>
          {recentActivity.map((a, i) => (
            <div key={i} style={{
              padding: 12, background: '#f9fafb', borderRadius: 8, marginBottom: 8,
              borderLeft: a.type === 'student' ? '3px solid #8b5cf6' :
                         a.type === 'course' ? '3px solid #10b981' :
                         a.type === 'mentor' ? '3px solid #06b6d4' : '3px solid #f59e0b'
            }}>
              <p style={{ fontSize: 13, margin: 0 }}>{a.text}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>{a.time}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Management Links */}
      <div style={{ marginTop: 24, background: 'white', padding: 24, borderRadius: 12 }}>
        <h2 style={{ marginBottom: 16 }}>Management</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { href: '/admin/students', icon: '👨‍🎓', label: 'Students', count: 1250 },
            { href: '/admin/courses', icon: '📚', label: 'Courses', count: 85 },
            { href: '/admin/mentors', icon: '🎓', label: 'Mentors', count: 45 },
            { href: '/admin/analytics', icon: '📊', label: 'Analytics', count: 0 },
          ].map(m => (
            <a key={m.href} href={m.href} style={{
              display: 'block', padding: 20, background: '#f9fafb', borderRadius: 12, textAlign: 'center', textDecoration: 'none', color: 'inherit'
            }}>
              <span style={{ fontSize: 40 }}>{m.icon}</span>
              <p style={{ fontWeight: 600, margin: '12px 0 4px' }}>{m.label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6', margin: 0 }}>{m.count}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

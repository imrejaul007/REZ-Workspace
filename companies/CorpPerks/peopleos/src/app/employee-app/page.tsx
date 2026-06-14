'use client';

import { useState } from 'react';

const quickActions = [
  { id: '1', icon: '✅', label: 'Attendance', action: 'Mark attendance' },
  { id: '2', icon: '🏖️', label: 'Leave', action: 'Apply leave' },
  { id: '3', icon: '💰', label: 'Payslip', action: 'View payslip' },
  { id: '4', icon: '📄', label: 'Documents', action: 'My documents' },
  { id: '5', icon: '💼', label: 'Tasks', action: 'View tasks' },
  { id: '6', icon: '📣', label: 'Announcements', action: 'Company news' },
  { id: '7', icon: '🎯', label: 'OKRs', action: 'My goals' },
  { id: '8', icon: '📊', label: 'Reports', action: 'Submit timesheet' },
];

const leaves = [
  { type: 'Casual', balance: 6, used: 2 },
  { type: 'Sick', balance: 8, used: 1 },
  { type: 'Earned', balance: 12, used: 3 },
];

const tasks = [
  { id: 1, title: 'Complete onboarding docs', due: 'Today', priority: 'high', status: 'pending' },
  { id: 2, title: 'Review security training', due: 'May 20', priority: 'medium', status: 'pending' },
  { id: 3, title: 'Submit timesheet', due: 'Today', priority: 'high', status: 'done' },
];

const announcements = [
  { id: 1, title: 'New health insurance policy', date: '2 hours ago', icon: '📢' },
  { id: 2, title: 'Office timings updated', date: '1 day ago', icon: '🏢' },
  { id: 3, title: 'Team outing on June 5th', date: '2 days ago', icon: '🎉' },
];

export default function EmployeeApp() {
  const [tab, setTab] = useState('home');

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', padding: 24, color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👤</div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>Welcome back!</p>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>Priya Sharma</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.8 }}>Software Engineer • Engineering</p>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Today&apos;s Attendance</p>
              <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700 }}>9:05 AM - Present</p>
            </div>
            <span style={{ background: '#10b981', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>On Time ✓</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {quickActions.map(action => (
            <div key={action.id} style={{ background: 'white', padding: 12, borderRadius: 12, textAlign: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: 24 }}>{action.icon}</span>
              <p style={{ fontSize: 10, margin: '8px 0 0' }}>{action.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leave Balance */}
      <div style={{ padding: '0 16px 16px' }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Leave Balance</p>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {leaves.map(leave => (
            <div key={leave.type} style={{ background: 'white', padding: 12, borderRadius: 12, minWidth: 90, textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#10b981', margin: 0 }}>{leave.balance - leave.used}</p>
              <p style={{ fontSize: 10, color: '#6b7280', margin: '4px 0 0' }}>{leave.type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>My Tasks</p>
          <span style={{ fontSize: 12, color: '#8b5cf6' }}>View All →</span>
        </div>
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
          {tasks.map(task => (
            <div key={task.id} style={{
              padding: 12, borderBottom: '1px solid #f3f4f6',
              display: 'flex', alignItems: 'center', gap: 12
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4, background: task.status === 'done' ? '#10b981' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
              }}>
                {task.status === 'done' ? '✓' : ''}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>{task.title}</p>
                <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>Due: {task.due}</p>
              </div>
              <span style={{
                padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 500,
                background: task.priority === 'high' ? '#fee2e2' : '#fef3c7',
                color: task.priority === 'high' ? '#dc2626' : '#b45309'
              }}>
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Announcements */}
      <div style={{ padding: '0 16px 16px' }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Company Updates</p>
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
          {announcements.map(a => (
            <div key={a.id} style={{ padding: 12, borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{a.title}</p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>{a.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e5e7eb', padding: '12px 0', display: 'flex', justifyContent: 'space-around' }}>
        {['🏠', '📋', '💰', '👤'].map((icon, i) => (
          <div key={i} style={{ textAlign: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: 24 }}>{icon}</span>
            <p style={{ fontSize: 10, margin: 0, color: '#6b7280' }}>{['Home', 'Tasks', 'Wallet', 'Profile'][i]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

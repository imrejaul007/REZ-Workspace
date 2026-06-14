'use client';

import { useState } from 'react';

const courses = [
  { id: '1', title: 'Full Stack Development', platform: 'Coursera', students: 245, completion: 78, revenue: '₹45,000' },
  { id: '2', title: 'Data Science Fundamentals', platform: 'Udemy', students: 189, completion: 65, revenue: '₹32,000' },
  { id: '3', title: 'UI/UX Design', platform: 'LinkedIn Learning', students: 156, completion: 82, revenue: '₹28,000' },
  { id: '4', title: 'Machine Learning', platform: 'Coursera', students: 98, completion: 45, revenue: '₹18,000' },
];

export default function AdminCourses() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Courses</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Manage course catalog and enrollments</p>
        </div>
        <button style={{ padding: '12px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          + Add Course
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Courses', value: 85, icon: '📚' },
          { label: 'Enrollments', value: '2,450', icon: '👥' },
          { label: 'Completion Rate', value: '68%', icon: '✅' },
          { label: 'Revenue', value: '₹1.2L', icon: '💰' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 32 }}>{s.icon}</span>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6', margin: '8px 0 0' }}>{s.value}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12 }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Course Performance</h2>
          <button style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Export</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Course</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Platform</th>
              <th style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>Students</th>
              <th style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>Completion</th>
              <th style={{ padding: 12, textAlign: 'right', fontSize: 13, color: '#6b7280' }}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: 16, fontWeight: 600 }}>{c.title}</td>
                <td style={{ padding: 16, color: '#6b7280' }}>{c.platform}</td>
                <td style={{ padding: 16, textAlign: 'center' }}>{c.students}</td>
                <td style={{ padding: 16, textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 100, height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                      <div style={{ width: `${c.completion}%`, height: '100%', background: '#10b981', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{c.completion}%</span>
                  </div>
                </td>
                <td style={{ padding: 16, textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{c.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

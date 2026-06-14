'use client';

import { useState } from 'react';

const students = [
  { id: '1', name: 'Priya Sharma', email: 'priya@student.edu', college: 'IIT Delhi', course: 'B.Tech', year: 'Final', status: 'active' },
  { id: '2', name: 'Rahul Verma', email: 'rahul@student.edu', college: 'IIT Bombay', course: 'B.Tech', year: 'Pre-final', status: 'active' },
  { id: '3', name: 'Sneha Patel', email: 'sneha@student.edu', college: 'NIT Jaipur', course: 'MCA', year: 'Final', status: 'active' },
  { id: '4', name: 'Amit Kumar', email: 'amit@student.edu', college: 'IIIT Hyderabad', course: 'B.Tech', year: 'Final', status: 'inactive' },
];

export default function AdminStudents() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = students.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Students</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Manage enrolled students</p>
        </div>
        <button style={{ padding: '12px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          + Add Student
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search students..."
          style={{ flex: 1, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Export
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Student</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 13, color: '#6b7280' }}>College</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Course</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Status</th>
              <th style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                      {s.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, margin: 0 }}>{s.name}</p>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{s.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: 16, color: '#6b7280' }}>{s.college}</td>
                <td style={{ padding: 16, color: '#6b7280' }}>{s.course} - {s.year}</td>
                <td style={{ padding: 16 }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    background: s.status === 'active' ? '#dcfce7' : '#f3f4f6',
                    color: s.status === 'active' ? '#15803d' : '#6b7280'
                  }}>
                    {s.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
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

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: '#6b7280' }}>Showing {filtered.length} of {students.length} students</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Previous</button>
          <button style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Next</button>
        </div>
      </div>
    </div>
  );
}

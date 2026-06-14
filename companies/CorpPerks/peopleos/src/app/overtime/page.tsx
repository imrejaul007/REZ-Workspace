'use client';

import { useState } from 'react';

const employees = [
  { id: 1, name: 'Priya Sharma', dept: 'Engineering', regular: 176, ot: 24, otRate: 14, status: 'compliant' },
  { id: 2, name: 'Rahul Verma', dept: 'Sales', regular: 180, ot: 45, otRate: 25, status: 'warning' },
  { id: 3, name: 'Sneha Patel', dept: 'Marketing', regular: 168, ot: 8, otRate: 5, status: 'compliant' },
  { id: 4, name: 'Amit Kumar', dept: 'Operations', regular: 192, ot: 56, otRate: 29, status: 'violation' },
];

export default function OvertimePage() {
  const [period, setPeriod] = useState('May 2026');

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>OT Intelligence</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Labor law compliance and overtime optimization</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total OT Hours', value: '1,245', icon: '⏰', color: '#f59e0b' },
          { label: 'OT Cost', value: '₹8.5L', icon: '💰', color: '#ef4444' },
          { label: 'Compliant', value: '89%', icon: '✅', color: '#10b981' },
          { label: 'Violations', value: '3', icon: '🚨', color: '#dc2626' },
        ].map(m => (
          <div key={m.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 24 }}>{m.icon}</span>
            <p style={{ fontSize: 28, fontWeight: 700, color: m.color, margin: '8px 0 0' }}>{m.value}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{m.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* OT by Department */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px' }}>OT by Department</h2>
          {[
            { dept: 'Operations', hours: 156, limit: 100, cost: '₹2.3L' },
            { dept: 'Engineering', hours: 89, limit: 100, cost: '₹1.2L' },
            { dept: 'Sales', hours: 72, limit: 100, cost: '₹98K' },
            { dept: 'Support', hours: 45, limit: 100, cost: '₹62K' },
          ].map(d => (
            <div key={d.dept} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{d.dept}</span>
                <span style={{ fontSize: 13, color: d.hours > d.limit ? '#dc2626' : '#10b981' }}>
                  {d.hours}/{d.limit}h • {d.cost}
                </span>
              </div>
              <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                <div style={{
                  width: `${Math.min(d.hours / d.limit * 100, 100)}%`, height: '100%',
                  background: d.hours > d.limit ? '#dc2626' : '#10b981', borderRadius: 4
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Labor Law Alerts */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px' }}>⚖️ Labor Law Alerts</h2>
          {[
            { type: 'violation', text: 'Operations dept exceeded 48hr/week limit' },
            { type: 'warning', text: '3 employees approaching OT cap' },
            { type: 'info', text: '2 comp-offs pending approval' },
          ].map((a, i) => (
            <div key={i} style={{
              padding: 12, borderRadius: 8, marginBottom: 8,
              background: a.type === 'violation' ? '#fee2e2' : a.type === 'warning' ? '#fef3c7' : '#dbeafe'
            }}>
              <p style={{ margin: 0, fontSize: 13, color: a.type === 'violation' ? '#dc2626' : a.type === 'warning' ? '#b45309' : '#1d4ed8' }}>
                {a.type === 'violation' ? '🚨' : a.type === 'warning' ? '⚠️' : 'ℹ️'} {a.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Employee OT List */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Employee OT Breakdown</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Employee</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Department</th>
              <th style={{ padding: 12, textAlign: 'right', fontSize: 13, color: '#6b7280' }}>Regular</th>
              <th style={{ padding: 12, textAlign: 'right', fontSize: 13, color: '#6b7280' }}>OT Hours</th>
              <th style={{ padding: 12, textAlign: 'right', fontSize: 13, color: '#6b7280' }}>OT Rate</th>
              <th style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: 16, fontWeight: 500 }}>{e.name}</td>
                <td style={{ padding: 16, color: '#6b7280' }}>{e.dept}</td>
                <td style={{ padding: 16, textAlign: 'right' }}>{e.regular}h</td>
                <td style={{ padding: 16, textAlign: 'right', color: e.otRate > 25 ? '#dc2626' : '#f59e0b', fontWeight: 600 }}>{e.ot}h</td>
                <td style={{ padding: 16, textAlign: 'right' }}>{e.otRate}%</td>
                <td style={{ padding: 16, textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    background: e.status === 'compliant' ? '#dcfce7' : e.status === 'warning' ? '#fef3c7' : '#fee2e2',
                    color: e.status === 'compliant' ? '#15803d' : e.status === 'warning' ? '#b45309' : '#dc2626'
                  }}>
                    {e.status === 'compliant' ? '✅ Compliant' : e.status === 'warning' ? '⚠️ Warning' : '🚨 Violation'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

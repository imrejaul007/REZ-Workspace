'use client';

import { useState } from 'react';

const employers = [
  { id: '1', name: 'Google', logo: '🔍', hiring: 45, roles: ['Software Engineer', 'Product Manager'] },
  { id: '2', name: 'Amazon', logo: '📦', hiring: 32, roles: ['SDE', 'Data Scientist'] },
  { id: '3', name: 'Microsoft', logo: '🪟', hiring: 28, roles: ['Frontend Dev', 'Cloud Engineer'] },
];

export default function EmployerConnectPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Employer Connections</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Connect directly with hiring companies</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', padding: 24, borderRadius: 16, color: 'white' }}>
          <p style={{ fontSize: 48, margin: 0 }}>📢</p>
          <p style={{ fontSize: 24, fontWeight: 700, margin: '12px 0 0' }}>156</p>
          <p style={{ opacity: 0.9, margin: 0 }}>Active recruiters viewing your profile</p>
        </div>
        <div style={{ background: '#10b981', padding: 24, borderRadius: 16, color: 'white' }}>
          <p style={{ fontSize: 48, margin: 0 }}>🎯</p>
          <p style={{ fontSize: 24, fontWeight: 700, margin: '12px 0 0' }}>89</p>
          <p style={{ opacity: 0.9, margin: 0 }}>Applications viewed</p>
        </div>
        <div style={{ background: '#f59e0b', padding: 24, borderRadius: 16, color: 'white' }}>
          <p style={{ fontSize: 48, margin: 0 }}>💼</p>
          <p style={{ fontSize: 24, fontWeight: 700, margin: '12px 0 0' }}>23</p>
          <p style={{ opacity: 0.9, margin: 0 }}>Interviews scheduled</p>
        </div>
      </div>

      <h2 style={{ marginBottom: 16 }}>Hiring Now</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {employers.map(emp => (
          <div key={emp.id} style={{ background: 'white', padding: 24, borderRadius: 16, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, background: '#f3f4f6', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
              {emp.logo}
            </div>
            <h3 style={{ margin: 0 }}>{emp.name}</h3>
            <p style={{ color: '#10b981', fontWeight: 600, margin: '8px 0' }}>{emp.hiring} open roles</p>
            <div style={{ marginTop: 12 }}>
              {emp.roles.map(role => (
                <div key={role} style={{ padding: '8px', background: '#f9fafb', borderRadius: 8, marginBottom: 4, fontSize: 13 }}>
                  {role}
                </div>
              ))}
            </div>
            <button style={{ marginTop: 16, width: '100%', padding: 10, background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              View Openings
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

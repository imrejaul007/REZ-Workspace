'use client';

import { useState } from 'react';

const roles = [
  { title: 'Software Engineer', location: 'Bangalore', exp: '2-4 years', salary: 12, percentile: 65 },
  { title: 'Senior Developer', location: 'Bangalore', exp: '4-6 years', salary: 22, percentile: 72 },
  { title: 'Tech Lead', location: 'Bangalore', exp: '6-8 years', salary: 35, percentile: 68 },
];

export default function SalaryBenchmark() {
  const [selectedRole, setSelectedRole] = useState(roles[0]);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Salary Benchmarking</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Know your market value</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Role Selection */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ marginBottom: 16 }}>Select Role</h2>
          {roles.map(role => (
            <div
              key={role.title}
              onClick={() => setSelectedRole(role)}
              style={{
                padding: 16, borderRadius: 12, marginBottom: 8, cursor: 'pointer',
                background: selectedRole.title === role.title ? '#f3f4f6' : 'transparent',
                border: selectedRole.title === role.title ? '2px solid #8b5cf6' : '2px solid transparent'
              }}
            >
              <p style={{ fontWeight: 600, margin: 0 }}>{role.title}</p>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0' }}>{role.location} • {role.exp}</p>
            </div>
          ))}
        </div>

        {/* Salary Analysis */}
        <div>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h2 style={{ marginBottom: 16 }}>Salary Analysis: {selectedRole.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: 20, background: '#f9fafb', borderRadius: 12 }}>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Market Rate</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6', margin: '8px 0 0' }}>₹{selectedRole.salary} LPA</p>
              </div>
              <div style={{ textAlign: 'center', padding: 20, background: '#f9fafb', borderRadius: 12 }}>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Percentile</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: '#10b981', margin: '8px 0 0' }}>{selectedRole.percentile}th</p>
              </div>
              <div style={{ textAlign: 'center', padding: 20, background: '#f9fafb', borderRadius: 12 }}>
                <p style={{ fontSize: 13, color: '#6b7288', margin: 0 }}>Experience</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b', margin: '8px 0 0' }}>{selectedRole.exp}</p>
              </div>
            </div>
          </div>

          {/* Salary Range */}
          <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
            <h2 style={{ marginBottom: 16 }}>Salary Distribution</h2>
            <div style={{ position: 'relative', height: 20, background: '#f3f4f6', borderRadius: 10 }}>
              <div style={{ width: '20%', height: '100%', background: '#8b5cf6', borderRadius: 10 }} />
              <div style={{ position: 'absolute', top: -8, left: '45%', width: 4, height: 36, background: '#10b981', borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>₹{Math.round(selectedRole.salary * 0.6)}L</span>
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>You</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>₹{Math.round(selectedRole.salary * 1.4)}L</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

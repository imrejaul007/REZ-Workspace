'use client';

import { useState } from 'react';

const employees = [
  { id: '1', name: 'Priya Sharma', role: 'Server', dept: 'Service', status: 'active', phone: '+91 98765 43210' },
  { id: '2', name: 'Rahul Verma', role: 'Chef', dept: 'Kitchen', status: 'active', phone: '+91 98765 43211' },
  { id: '3', name: 'Sneha Patel', role: 'Manager', dept: 'Operations', status: 'probation', phone: '+91 98765 43212' },
];

export default function EmployeesPage() {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Employees</h1>
          <p style={{ color: '#6b7280' }}>{employees.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            placeholder="Search employees..."
            style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          />
          <button style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 500 }}>
            + Add Employee
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ padding: '6px 16px', background: '#dcfce7', color: '#15803d', borderRadius: '20px', fontWeight: 500 }}>
            All ({employees.length})
          </button>
          <button style={{ padding: '6px 16px', color: '#6b7280' }}>Active (2)</button>
          <button style={{ padding: '6px 16px', color: '#6b7280' }}>Probation (1)</button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>
              <th style={{ padding: '12px 16px' }}>Employee</th>
              <th style={{ padding: '12px 16px' }}>Role</th>
              <th style={{ padding: '12px 16px' }}>Department</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 14 }}>
                      {emp.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p style={{ fontWeight: 500 }}>{emp.name}</p>
                      <p style={{ fontSize: 13, color: '#6b7280' }}>{emp.phone}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>{emp.role}</td>
                <td style={{ padding: '16px' }}>{emp.dept}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: emp.status === 'active' ? '#dcfce7' : '#fef3c7', color: emp.status === 'active' ? '#15803d' : '#b45309' }}>
                    {emp.status}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <button style={{ color: '#10b981', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>View Profile</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

const employees = [
  { id: '1', name: 'Priya Sharma', department: 'Engineering', salary: 85000, status: 'pending' },
  { id: '2', name: 'Rahul Verma', department: 'Marketing', salary: 65000, status: 'approved' },
  { id: '3', name: 'Sneha Patel', department: 'Sales', salary: 55000, status: 'pending' },
];

export default function PayrollAutomationPage() {
  const [cycle, setCycle] = useState('May 2026');

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>💰 Payroll Automation</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Automated salary processing and compliance</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Payroll', value: '₹12,50,000', icon: '💰', color: '#10b981' },
          { label: 'Employees', value: '45', icon: '👥', color: '#8b5cf6' },
          { label: 'Approved', value: '42', icon: '✅', color: '#10b981' },
          { label: 'Pending', value: '3', icon: '⏳', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <p style={{ fontSize: 24, fontWeight: 700, color: s.color, margin: '8px 0 0' }}>{s.value}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Processing Steps */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Auto-Processing Pipeline</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['attendance', 'leaves', 'calculate', 'deductions', 'netpay'].map((step, i) => (
            <div key={step} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: i < 2 ? '#10b981' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', margin: '0 auto 8px', fontWeight: 600
              }}>
                {i + 1}
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                {step === 'attendance' ? 'Attendance' :
                 step === 'leaves' ? 'Leaves' :
                 step === 'calculate' ? 'Calculate' :
                 step === 'deductions' ? 'Deductions' : 'Net Pay'}
              </p>
            </div>
          ))}
        </div>
        <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, marginTop: 16 }}>
          <div style={{ width: '40%', height: '100%', background: '#10b981', borderRadius: 4 }} />
        </div>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Step 1-2 completed automatically</p>
      </div>

      {/* Payroll Cycle */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Payroll Cycle: {cycle}</h2>
          <select
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 8 }}
          >
            <option>May 2026</option>
            <option>April 2026</option>
            <option>March 2026</option>
          </select>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Employee</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>Department</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280' }}>Gross</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280' }}>Deductions</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280' }}>Net Pay</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#6b7280' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#6b7280' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: 16, fontWeight: 500 }}>{emp.name}</td>
                <td style={{ padding: 16, color: '#6b7280' }}>{emp.department}</td>
                <td style={{ padding: 16, textAlign: 'right' }}>₹{emp.salary.toLocaleString()}</td>
                <td style={{ padding: 16, textAlign: 'right', color: '#ef4444' }}>-₹{(emp.salary * 0.12).toFixed(0)}</td>
                <td style={{ padding: 16, textAlign: 'right', fontWeight: 600, color: '#10b981' }}>₹{(emp.salary * 0.88).toLocaleString()}</td>
                <td style={{ padding: 16, textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12,
                    background: emp.status === 'approved' ? '#dcfce7' : '#fef3c7',
                    color: emp.status === 'approved' ? '#15803d' : '#b45309',
                  }}>
                    {emp.status === 'approved' ? '✅ Approved' : '⏳ Pending'}
                  </span>
                </td>
                <td style={{ padding: 16, textAlign: 'center' }}>
                  {emp.status === 'pending' && (
                    <button style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compliance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { name: 'PF Calculation', status: 'Auto', icon: '🏦' },
          { name: 'TDS Deduction', status: 'Auto', icon: '📊' },
          { name: 'ESI Contribution', status: 'Auto', icon: '🏥' },
        ].map(item => (
          <div key={item.name} style={{ background: 'white', padding: 20, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 32 }}>{item.icon}</span>
            <div>
              <p style={{ fontWeight: 600, margin: 0 }}>{item.name}</p>
              <p style={{ fontSize: 13, color: '#10b981', margin: 0 }}>✅ {item.status}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Process Button */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button style={{ padding: '14px 32px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
          �Automated Payroll Run - Process {cycle}
        </button>
      </div>
    </div>
  );
}

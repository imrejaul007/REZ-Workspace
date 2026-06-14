'use client';

import { useState } from 'react';

const payslips = [
  { id: '1', month: 'May 2026', status: 'paid', amount: '₹45,000' },
  { id: '2', month: 'April 2026', status: 'paid', amount: '₹45,000' },
  { id: '3', month: 'March 2026', status: 'paid', amount: '₹42,000' },
];

export default function PayrollPage() {
  const [tab, setTab] = useState('payslips');

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Payroll</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Payroll', value: '₹2,10,000', icon: '💰' },
          { label: 'This Month', value: '₹45,000', icon: '📅' },
          { label: 'Pending', value: '3', icon: '⏳' },
          { label: 'Paid', value: '42', icon: '✅' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <span style={{ fontSize: 24 }}>{stat.icon}</span>
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{stat.value}</p>
              <p style={{ fontSize: 13, color: '#6b7280' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['payslips', 'salary', 'compliance'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              background: tab === t ? '#10b981' : '#e5e7eb',
              color: tab === t ? 'white' : '#4b5563',
            }}>
            {t === 'payslips' ? 'Payslips' : t === 'salary' ? 'Salary Structure' : 'Compliance'}
          </button>
        ))}
      </div>

      {/* Payslips List */}
      {tab === 'payslips' && (
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>
                <th style={{ padding: '12px 16px' }}>Month</th>
                <th style={{ padding: '12px 16px' }}>Amount</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((payslip) => (
                <tr key={payslip.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px' }}>{payslip.month}</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{payslip.amount}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                      background: payslip.status === 'paid' ? '#dcfce7' : '#fef3c7',
                      color: payslip.status === 'paid' ? '#15803d' : '#b45309',
                    }}>
                      {payslip.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button style={{
                      background: 'none',
                      border: 'none',
                      color: '#10b981',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'salary' && (
        <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
          <h3 style={{ marginBottom: 16 }}>Salary Structure</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr', gap: 16 }}>
            {[
              { label: 'Basic', value: '₹30,000' },
              { label: 'HRA', value: '₹10,000' },
              { label: 'Transport', value: '₹3,000' },
              { label: 'Medical', value: '₹2,000' },
            ].map((item) => (
              <div key={item.label} style={{
                padding: 16,
                background: '#f9fafb',
                borderRadius: 8,
              }}>
                <p style={{ fontSize: 13, color: '#6b7280' }}>{item.label}</p>
                <p style={{ fontSize: 18, fontWeight: 600 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'compliance' && (
        <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
          <h3 style={{ marginBottom: 16 }}>Compliance Checklist</h3>
          {[
            'PF filing',
            'ESI contribution',
            'TDS deduction',
            'Professional tax',
            'Form 16 generation',
          ].map((item, i) => (
            <div key={item} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderBottom: '1px solid #e5e7eb',
            }}>
              <input type="checkbox" defaultChecked />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

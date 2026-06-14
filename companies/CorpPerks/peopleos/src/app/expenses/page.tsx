'use client';

import { useState } from 'react';

const expenses = [
  { id: '1', title: 'Travel to Client Meeting', category: 'travel', amount: 2500, status: 'pending', date: 'May 15, 2026' },
  { id: '2', title: 'Office Supplies', category: 'supplies', amount: 1200, status: 'approved', date: 'May 14, 2026' },
  { id: '3', title: 'Team Lunch', category: 'food', amount: 3500, status: 'rejected', date: 'May 12, 2026' },
  { id: '4', title: 'Software License', category: 'tools', amount: 15000, status: 'approved', date: 'May 10, 2026' },
];

const categories = [
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'food', name: 'Food', icon: '🍽️' },
  { id: 'supplies', name: 'Supplies', icon: '📦' },
  { id: 'tools', name: 'Tools', icon: '💻' },
  { id: 'training', name: 'Training', icon: '📚' },
  { id: 'equipment', name: 'Equipment', icon: '🖥️' },
];

export default function ExpensesPage() {
  const [active, setActive] = useState('all');
  const [showNew, setShowNew] = useState(false);

  const filtered = active === 'all' ? expenses : expenses.filter(e => e.category === active);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>💰 Expenses</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Track and approve expenses</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
        >
          + New Expense
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Pending', value: '₹12,500', icon: '⏳', color: '#f59e0b' },
          { label: 'Approved', value: '₹45,000', icon: '✅', color: '#10b981' },
          { label: 'Rejected', value: '₹3,500', icon: '❌', color: '#ef4444' },
          { label: 'This Month', value: '₹61,000', icon: '📊', color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <p style={{ fontSize: 24, fontWeight: 700, color: s.color, margin: '8px 0 0' }}>{s.value}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto' }}>
        <button
          onClick={() => setActive('all')}
          style={{
            padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 500,
            background: active === 'all' ? '#10b981' : '#e5e7eb',
            color: active === 'all' ? 'white' : '#6b7280',
          }}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActive(cat.id)}
            style={{
              padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 500,
              background: active === cat.id ? '#10b981' : '#e5e7eb',
              color: active === cat.id ? 'white' : '#6b7280',
            }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Expenses List */}
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>Expense</th>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>Category</th>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>Date</th>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>Amount</th>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>Status</th>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(exp => (
              <tr key={exp.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px' }}>
                  <p style={{ fontWeight: 500, margin: 0 }}>{exp.title}</p>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ padding: '4px 10px', background: '#f3f4f6', borderRadius: 12, fontSize: 12 }}>
                    {categories.find(c => c.id === exp.category)?.icon} {exp.category}
                  </span>
                </td>
                <td style={{ padding: '16px', color: '#6b7280' }}>{exp.date}</td>
                <td style={{ padding: '16px', fontWeight: 600 }}>₹{exp.amount.toLocaleString()}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    background: exp.status === 'approved' ? '#dcfce7' : exp.status === 'pending' ? '#fef3c7' : '#fee2e2',
                    color: exp.status === 'approved' ? '#15803d' : exp.status === 'pending' ? '#b45309' : '#dc2626',
                  }}>
                    {exp.status === 'approved' ? '✅ Approved' : exp.status === 'pending' ? '⏳ Pending' : '❌ Rejected'}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  {exp.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                        Approve
                      </button>
                      <button style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                        Reject
                      </button>
                    </div>
                  )}
                  {exp.status !== 'pending' && (
                    <button style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Expense Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 16, width: 500 }}>
            <h2 style={{ marginBottom: 24 }}>New Expense</h2>
            <input placeholder="Title" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }} />
            <select style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }}>
              <option>Travel</option>
              <option>Food</option>
              <option>Supplies</option>
            </select>
            <input placeholder="Amount" type="number" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }} />
            <textarea placeholder="Description" rows={3} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowNew(false)} style={{ flex: 1, padding: 12, background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                Cancel
              </button>
              <button style={{ flex: 1, padding: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';

const scholarships = [
  { id: '1', title: 'Tech Excellence Scholarship', provider: 'Google', amount: '₹50,000', deadline: 'Jun 15, 2026', eligibility: 'CGPA > 8.5', status: 'eligible' },
  { id: '2', title: 'Women in STEM', provider: 'Microsoft', amount: '₹75,000', deadline: 'Jun 30, 2026', eligibility: 'Female students', status: 'eligible' },
  { id: '3', title: 'Startup Founder Grant', provider: 'Startup India', amount: '₹1,00,000', deadline: 'Jul 1, 2026', eligibility: 'Business plan required', status: 'pending' },
  { id: '4', title: 'Research Fellowship', provider: 'IIT', amount: '₹25,000/mo', deadline: 'May 30, 2026', eligibility: 'Research proposal', status: 'not_eligible' },
];

export default function ScholarshipsPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>🎓 Scholarships</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Grants, scholarships, and funding opportunities</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#10b981', margin: 0 }}>₹2.25L</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Available</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#8b5cf6', margin: 0 }}>2</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Eligible</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b', margin: 0 }}>1</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Pending</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#06b6d4', margin: 0 }}>4</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Total</p>
        </div>
      </div>

      {scholarships.map(scholarship => (
        <div key={scholarship.id} style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, background: '#f3f4f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            🎓
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0 }}>{scholarship.title}</h3>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0' }}>{scholarship.provider} • Deadline: {scholarship.deadline}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Eligibility: {scholarship.eligibility}</p>
          </div>
          <div style={{ textAlign: 'right', marginRight: 16 }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#10b981', margin: 0 }}>{scholarship.amount}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Amount</p>
          </div>
          <span style={{
            padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: scholarship.status === 'eligible' ? '#dcfce7' : scholarship.status === 'pending' ? '#fef3c7' : '#fee2e2',
            color: scholarship.status === 'eligible' ? '#15803d' : scholarship.status === 'pending' ? '#b45309' : '#dc2626',
          }}>
            {scholarship.status === 'eligible' ? '✅ Eligible' : scholarship.status === 'pending' ? '⏳ Pending' : '❌ Not Eligible'}
          </span>
          {scholarship.status !== 'not_eligible' && (
            <button style={{ padding: '10px 20px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
              Apply
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

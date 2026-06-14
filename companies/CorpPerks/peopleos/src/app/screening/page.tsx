'use client';

import { useState } from 'react';

const candidates = [
  { id: '1', name: 'Priya Sharma', role: 'React Developer', stage: 'document', progress: 60, bgv: { education: 'verified', employment: 'pending', address: 'verified', criminal: 'pending' } },
  { id: '2', name: 'Rahul Verma', role: 'Backend Engineer', stage: 'reference', progress: 80, bgv: { education: 'verified', employment: 'verified', address: 'verified', criminal: 'pending' } },
  { id: '3', name: 'Sneha Patel', role: 'Product Designer', stage: 'approved', progress: 100, bgv: { education: 'verified', employment: 'verified', address: 'verified', criminal: 'verified' } },
  { id: '4', name: 'Amit Kumar', role: 'ML Engineer', stage: 'offer', progress: 95, bgv: { education: 'verified', employment: 'pending', address: 'verified', criminal: 'verified' } },
];

const checks = [
  { id: 'education', name: 'Education Verification', icon: '🎓', desc: 'Verify degrees and certificates' },
  { id: 'employment', name: 'Employment History', icon: '💼', desc: 'Previous employer verification' },
  { id: 'address', name: 'Address Verification', icon: '🏠', desc: 'Current address proof' },
  { id: 'criminal', name: 'Criminal Check', icon: '🔍', desc: 'Criminal record verification' },
  { id: 'reference', name: 'Reference Check', icon: '📞', desc: 'Previous manager references' },
  { id: 'social', name: 'Social Media', icon: '📱', desc: 'Public profile verification' },
];

const statusColors: Record<string, string> = {
  verified: '#10b981',
  pending: '#f59e0b',
  failed: '#ef4444',
};

export default function ScreeningPage() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? candidates : candidates.filter(c => c.stage === filter);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Employee Screening</h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0' }}>Automated background verification</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total', value: candidates.length, icon: '👥' },
          { label: 'In Progress', value: 2, icon: '⏳' },
          { label: 'Verified', value: 1, icon: '✅' },
          { label: 'Pending', value: 1, icon: '🟡' },
          { label: 'Auto-Approved', value: 0, icon: '🤖' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <p style={{ fontSize: 28, fontWeight: 700, margin: '8px 0 0', color: '#8b5cf6' }}>{s.value}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 24 }}>
        {/* Verification Types */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ marginBottom: 16 }}>Auto-Checks</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Automated background verification checks
          </p>
          {checks.map(check => (
            <div key={check.id} style={{
              padding: 16, background: '#f9fafb', borderRadius: 8, marginBottom: 8, cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{check.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{check.name}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{check.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Candidates */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2>Candidates</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }}
              >
                <option value="all">All Stages</option>
                <option value="document">Document</option>
                <option value="reference">Reference</option>
                <option value="approved">Approved</option>
                <option value="offer">Offer</option>
              </select>
            </div>
          </div>

          {filtered.map(candidate => (
            <div key={candidate.id} style={{
              padding: 20, background: '#f9fafb', borderRadius: 12, marginBottom: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: '#8b5cf6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 600, fontSize: 16
                  }}>
                    {candidate.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{candidate.name}</p>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{candidate.role}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    background: candidate.stage === 'approved' ? '#dcfce7' : '#e5e7eb',
                    color: candidate.stage === 'approved' ? '#15803d' : '#6b7280'
                  }}>
                    {candidate.stage === 'document' ? '📄 Document' :
                     candidate.stage === 'reference' ? '📞 Reference' :
                     candidate.stage === 'approved' ? '✅ Verified' : '📋 Offer'}
                  </span>
                  <div style={{ width: 60, textAlign: 'center' }}>
                    <div style={{ height: 60, width: 60, borderRadius: '50%', position: 'relative' }}>
                      <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
                          strokeDasharray={`${candidate.progress} 100`} />
                      </svg>
                      <span style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 12, fontWeight: 600
                      }}>
                        {candidate.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BGV Status */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(candidate.bgv).map(([key, status]) => (
                  <span key={key} style={{
                    padding: '4px 10px', background: statusColors[status] + '20', color: statusColors[status],
                    borderRadius: 20, fontSize: 11, fontWeight: 500
                  }}>
                    {status === 'verified' ? '✅' : status === 'pending' ? '⏳' : '❌'} {key}
                  </span>
                ))}
              </div>

              {/* Auto-Approve Banner */}
              {candidate.progress === 100 && (
                <div style={{
                  marginTop: 12, padding: '12px 16px', background: '#dcfce7', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🤖</span>
                    <span style={{ fontSize: 13, color: '#15803d' }}>
                      <strong>Auto-approved!</strong> All checks passed
                    </span>
                  </div>
                  <button style={{
                    padding: '8px 16px', background: '#10b981', color: 'white',
                    border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500
                  }}>
                    Approve Candidate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Screening Rules */}
      <div style={{ marginTop: 24, background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', padding: 24, borderRadius: 16, color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <span style={{ fontSize: 40 }}>🤖</span>
          <div>
            <h2 style={{ margin: 0 }}>AI-Powered Auto-Screening</h2>
            <p style={{ opacity: 0.9, margin: '4px 0 0' }}>
              Automatically verify candidates based on configurable rules
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 12 }}>
            <p style={{ fontWeight: 600, margin: '0 0 8px' }}>Auto-verify education</p>
            <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>
              Cross-check with NIRF, UGC database
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 12 }}>
            <p style={{ fontWeight: 600, margin: '0 0 8px' }}>Auto-verify employment</p>
            <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>
              Check PF, tax records, company verification
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 12 }}>
            <p style={{ fontWeight: 600, margin: '0 0 8px' }}>Auto-address check</p>
            <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>
              Verify with Aadhaar, voter ID, passport
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

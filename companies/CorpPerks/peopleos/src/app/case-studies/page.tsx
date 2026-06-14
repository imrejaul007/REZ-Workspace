'use client';

import { useState } from 'react';

const caseStudies = [
  {
    id: 1,
    company: 'TechCorp India',
    industry: 'IT Services',
    size: '500 employees',
    challenge: 'High attrition rate (28%) and manual HR processes',
    solution: ['AI Attrition Prediction', 'WhatsApp HR Bot', 'Geo-Fence Attendance'],
    results: [
      { metric: 'Attrition Rate', before: '28%', after: '12%', label: '-57%' },
      { metric: 'HR Response Time', before: '4 hours', after: '30 sec', label: '-99%' },
      { metric: 'Attendance Accuracy', before: '78%', after: '97%', label: '+24%' },
      { metric: 'Employee Satisfaction', before: '62', after: '87', label: '+40%' },
    ],
    quote: 'PeopleOS transformed our HR operations. The AI predictions alone saved us from losing 15 key engineers.',
    author: 'CHRO, TechCorp India',
  },
  {
    id: 2,
    company: 'RetailMax',
    industry: 'Retail',
    size: '2,000 employees',
    challenge: 'Distributed workforce with 50+ locations, manual attendance tracking',
    solution: ['Geo-Fence Attendance', 'Mobile Self-Service', 'Benefits Wallet'],
    results: [
      { metric: 'Attendance Compliance', before: '65%', after: '99%', label: '+52%' },
      { metric: 'Payroll Errors', before: '12%', after: '0.5%', label: '-96%' },
      { metric: 'HR Tickets', before: '500/mo', after: '50/mo', label: '-90%' },
      { metric: 'Benefits Utilization', before: '45%', after: '89%', label: '+98%' },
    ],
    quote: 'Managing 50 stores was chaos. Now it&apos;s seamless. WhatsApp attendance is a game changer for our field staff.',
    author: 'VP HR, RetailMax',
  },
  {
    id: 3,
    company: 'HealthFirst Clinics',
    industry: 'Healthcare',
    size: '350 employees',
    challenge: 'Shift workers with complex scheduling and compliance requirements',
    solution: ['Smart Scheduling', 'Compliance Automation', 'Burnout Detection'],
    results: [
      { metric: 'Scheduling Time', before: '40 hrs/week', after: '2 hrs/week', label: '-95%' },
      { metric: 'Compliance Issues', before: '23', after: '0', label: '-100%' },
      { metric: 'Burnout Rate', before: '35%', after: '8%', label: '-77%' },
      { metric: 'Staff Retention', before: '71%', after: '94%', label: '+32%' },
    ],
    quote: 'The burnout detection feature helped us intervene before losing 3 senior doctors. Priceless.',
    author: 'COO, HealthFirst Clinics',
  },
];

export default function CaseStudiesPage() {
  const [active, setActive] = useState(0);

  const study = caseStudies[active];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Case Studies</h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0' }}>Real results from real companies</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {caseStudies.map((cs, i) => (
          <button
            key={cs.id}
            onClick={() => setActive(i)}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              fontWeight: 600,
              background: active === i ? '#8b5cf6' : '#e5e7eb',
              color: active === i ? 'white' : '#6b7280',
            }}
          >
            {cs.company}
          </button>
        ))}
      </div>

      {/* Case Study */}
      <div style={{ background: 'white', borderRadius: 16, padding: 32 }}>
        <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
          <div style={{ flex: 1 }}>
            <span style={{ padding: '4px 12px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
              {study.industry}
            </span>
            <h2 style={{ fontSize: 32, margin: '16px 0 4px' }}>{study.company}</h2>
            <p style={{ color: '#6b7280', margin: 0 }}>{study.size}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <h3 style={{ marginBottom: 12 }}>The Challenge</h3>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>{study.challenge}</p>

            <h3 style={{ marginBottom: 12 }}>Solution Implemented</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {study.solution.map(s => (
                <span key={s} style={{ padding: '8px 16px', background: '#f3f4f6', borderRadius: 20, fontSize: 13 }}>
                  ✅ {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: 12 }}>Results</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {study.results.map(r => (
                <div key={r.metric} style={{ padding: 16, background: '#f0fdf4', borderRadius: 12 }}>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{r.metric}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{r.before}</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>→ {r.after}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: '#f9fafb', padding: 24, borderRadius: 12, marginTop: 24, borderLeft: '4px solid #8b5cf6' }}>
          <p style={{ fontSize: 18, fontStyle: 'italic', margin: '0 0 12px' }}>
            &quot;{study.quote}&quot;
          </p>
          <p style={{ fontWeight: 600, margin: 0 }}>- {study.author}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24 }}>
        {[
          { value: '50+', label: 'Companies' },
          { value: '25,000+', label: 'Employees' },
          { value: '67%', label: 'Avg Retention Improvement' },
          { value: '4.8/5', label: 'Customer Rating' },
        ].map(s => (
          <div key={s.label} style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', padding: 24, borderRadius: 12, color: 'white', textAlign: 'center' }}>
            <p style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 13, opacity: 0.9, margin: '8px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

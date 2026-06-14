'use client';

import { useState } from 'react';

const predictions = [
  { id: 1, task: 'Complete API integration', assignee: 'Priya Sharma', risk: 'high', due: 'May 20', factors: ['Overloaded schedule', 'Blocked by dependencies', 'Late check-ins'] },
  { id: 2, task: 'Design new dashboard', assignee: 'Rahul Verma', risk: 'medium', due: 'May 22', factors: ['Multiple reassignments', 'Unclear requirements'] },
  { id: 3, task: 'Write unit tests', assignee: 'Sneha Patel', risk: 'low', due: 'May 25', factors: ['On track'] },
];

const team = [
  { name: 'Priya Sharma', workload: 95, tasks: 8, capacity: 100 },
  { name: 'Rahul Verma', workload: 78, tasks: 6, capacity: 100 },
  { name: 'Sneha Patel', workload: 65, tasks: 4, capacity: 100 },
  { name: 'Amit Kumar', workload: 88, tasks: 7, capacity: 100 },
];

export default function TaskIntelligencePage() {
  const [tab, setTab] = useState('predictions');

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Task Intelligence</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>AI predicts delays before they happen</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'At Risk Tasks', value: 12, icon: '⚠️', color: '#ef4444' },
          { label: 'Delayed Today', value: 5, icon: '🚨', color: '#f59e0b' },
          { label: 'Completed', value: 89, icon: '✅', color: '#10b981' },
          { label: 'Blocked', value: 8, icon: '🚧', color: '#6b7280' },
        ].map(m => (
          <div key={m.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 24 }}>{m.icon}</span>
            <p style={{ fontSize: 28, fontWeight: 700, color: m.color, margin: '8px 0 0' }}>{m.value}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{m.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['predictions', 'workload', 'bottlenecks'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500,
            background: tab === t ? '#8b5cf6' : '#e5e7eb', color: tab === t ? 'white' : '#6b7280'
          }}>
            {t === 'predictions' ? '🔮 Predictions' : t === 'workload' ? '⚖️ Workload' : '🔗 Bottlenecks'}
          </button>
        ))}
      </div>

      {tab === 'predictions' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px' }}>Delay Predictions</h2>
          {predictions.map(p => (
            <div key={p.id} style={{
              padding: 20, background: '#f9fafb', borderRadius: 12, marginBottom: 12,
              borderLeft: p.risk === 'high' ? '4px solid #ef4444' : p.risk === 'medium' ? '4px solid #f59e0b' : '4px solid #10b981'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <p style={{ fontWeight: 600, margin: 0 }}>{p.task}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Assigned to: {p.assignee}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    background: p.risk === 'high' ? '#fee2e2' : p.risk === 'medium' ? '#fef3c7' : '#dcfce7',
                    color: p.risk === 'high' ? '#dc2626' : p.risk === 'medium' ? '#b45309' : '#15803d'
                  }}>
                    {p.risk.toUpperCase()} RISK
                  </span>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Due: {p.due}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {p.factors.map((f, i) => (
                  <span key={i} style={{
                    padding: '4px 10px', background: p.risk === 'high' ? '#fee2e2' : '#fef3c7',
                    color: p.risk === 'high' ? '#dc2626' : '#b45309', borderRadius: 12, fontSize: 12
                  }}>
                    ⚠️ {f}
                  </span>
                ))}
              </div>
              <button style={{ marginTop: 12, padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                {p.risk === 'high' ? '🚨 Escalate' : '💡 Suggest Action'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'workload' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px' }}>Team Workload Distribution</h2>
          {team.map(t => (
            <div key={t.name} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 500 }}>{t.name}</span>
                <span style={{ fontWeight: 600, color: t.workload > 90 ? '#ef4444' : t.workload > 80 ? '#f59e0b' : '#10b981' }}>
                  {t.workload}% ({t.tasks} tasks)
                </span>
              </div>
              <div style={{ height: 12, background: '#e5e7eb', borderRadius: 6 }}>
                <div style={{
                  width: `${t.workload}%`, height: '100%', borderRadius: 6,
                  background: t.workload > 90 ? '#ef4444' : t.workload > 80 ? '#f59e0b' : '#10b981'
                }} />
              </div>
            </div>
          ))}
          <div style={{ background: '#fef3c7', padding: 16, borderRadius: 8, marginTop: 16 }}>
            <p style={{ margin: 0, color: '#b45309', fontSize: 13 }}>
              💡 <strong>AI Suggestion:</strong> Redistribute 2 tasks from Priya to Sneha for optimal team performance
            </p>
          </div>
        </div>
      )}

      {tab === 'bottlenecks' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px' }}>Execution Bottlenecks</h2>
          {[
            { bottleneck: 'Waiting for design approval', tasks: 5, impact: 'High' },
            { bottleneck: 'API documentation pending', tasks: 3, impact: 'Medium' },
            { bottleneck: 'QA team overloaded', tasks: 8, impact: 'High' },
          ].map((b, i) => (
            <div key={i} style={{ padding: 16, background: '#f9fafb', borderRadius: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontWeight: 500, margin: 0 }}>{b.bottleneck}</p>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: b.impact === 'High' ? '#fee2e2' : '#fef3c7',
                  color: b.impact === 'High' ? '#dc2626' : '#b45309'
                }}>
                  {b.impact} Impact
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0 0' }}>{b.tasks} tasks blocked</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

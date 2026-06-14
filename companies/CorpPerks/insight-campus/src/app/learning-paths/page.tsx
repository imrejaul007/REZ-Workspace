'use client';

import { useState } from 'react';

const paths = [
  {
    id: '1',
    title: 'Full Stack Developer',
    duration: '6 months',
    courses: 8,
    icon: '💻',
    color: '#8b5cf6',
    steps: ['HTML/CSS Basics', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'APIs', 'Git', 'Projects']
  },
  {
    id: '2',
    title: 'Data Scientist',
    duration: '8 months',
    courses: 10,
    icon: '📊',
    color: '#10b981',
    steps: ['Python', 'Statistics', 'ML Basics', 'TensorFlow', 'Projects', 'Deep Learning', 'NLP', 'Deploy ML']
  },
  {
    id: '3',
    title: 'Product Manager',
    duration: '4 months',
    courses: 6,
    icon: '💼',
    color: '#06b6d4',
    steps: ['Basics', 'User Research', 'Roadmapping', 'Agile', 'Analytics', 'Capstone']
  },
];

export default function LearningPathsPage() {
  const [selected, setSelected] = useState(paths[0]);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Learning Paths</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Structured journeys to your dream career</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Paths */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paths.map(path => (
            <div
              key={path.id}
              onClick={() => setSelected(path)}
              style={{
                padding: 20, background: 'white', borderRadius: 12, cursor: 'pointer',
                border: selected.id === path.id ? `2px solid ${path.color}` : '2px solid transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: path.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  {path.icon}
                </div>
                <div>
                  <p style={{ fontWeight: 600, margin: 0 }}>{path.title}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{path.duration} • {path.courses} courses</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Journey */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: selected.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
              {selected.icon}
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{selected.title}</h2>
              <p style={{ color: '#6b7280', margin: '4px 0 0' }}>{selected.duration} • {selected.courses} courses</p>
            </div>
          </div>

          <h3 style={{ marginBottom: 16 }}>Your Journey</h3>
          <div style={{ position: 'relative' }}>
            {selected.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, marginBottom: i < selected.steps.length - 1 ? 0 : 0, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: i === 2 ? '#10b981' : '#e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600,
                    color: i === 2 ? 'white' : '#6b7280'
                  }}>
                    {i + 1}
                  </div>
                  {i < selected.steps.length - 1 && (
                    <div style={{ width: 2, height: 40, background: '#e5e7eb' }} />
                  )}
                </div>
                <div style={{ paddingBottom: 24 }}>
                  <p style={{ fontWeight: 500, margin: '6px 0 0' }}>{step}</p>
                </div>
              </div>
            ))}
          </div>

          <button style={{ marginTop: 24, width: '100%', padding: 14, background: selected.color, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            Start Learning Path
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

const courses = [
  { id: '1', title: 'Complete Web Development', platform: 'Coursera', progress: 75, duration: '40 hours', category: 'Development' },
  { id: '2', title: 'Data Science Fundamentals', platform: 'Udemy', progress: 45, duration: '30 hours', category: 'Data' },
  { id: '3', title: 'UI/UX Design Masterclass', platform: 'LinkedIn Learning', progress: 20, duration: '25 hours', category: 'Design' },
  { id: '4', title: 'AWS Cloud Practitioner', platform: 'Coursera', progress: 0, duration: '20 hours', category: 'Cloud' },
];

const recommendations = [
  { id: '1', title: 'Machine Learning Basics', reason: 'Based on your interest in AI', icon: '🤖' },
  { id: '2', title: 'Product Management', reason: 'Popular among your peer group', icon: '💼' },
  { id: '3', title: 'React Native Development', reason: 'High demand skill', icon: '📱' },
];

export default function CoursesPage() {
  const [tab, setTab] = useState('my');

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>📚 Courses</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Learn new skills with top platforms</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['my', 'recommended', 'all'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500,
            background: tab === t ? '#8b5cf6' : '#e5e7eb', color: tab === t ? 'white' : '#6b7280',
          }}>
            {t === 'my' ? 'My Courses' : t === 'recommended' ? 'Recommended' : 'Browse All'}
          </button>
        ))}
      </div>

      {tab === 'my' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', padding: 24, borderRadius: 16, color: 'white' }}>
              <p style={{ fontSize: 13, opacity: 0.9 }}>Overall Progress</p>
              <p style={{ fontSize: 48, fontWeight: 700, margin: '8px 0' }}>45%</p>
              <p style={{ fontSize: 14, opacity: 0.9 }}>2 of 4 courses completed</p>
            </div>
            <div style={{ background: 'white', padding: 24, borderRadius: 16 }}>
              <p style={{ color: '#6b7280', fontSize: 13 }}>Hours Learned</p>
              <p style={{ fontSize: 48, fontWeight: 700, color: '#10b981', margin: '8px 0' }}>52</p>
              <p style={{ color: '#6b7280', fontSize: 14 }}>Keep it up!</p>
            </div>
          </div>

          <h2 style={{ marginBottom: 16 }}>My Courses</h2>
          {courses.map(course => (
            <div key={course.id} style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 12, display: 'flex', gap: 16 }}>
              <div style={{ width: 80, height: 80, background: '#f3f4f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                {course.category === 'Development' ? '💻' : course.category === 'Data' ? '📊' : course.category === 'Design' ? '🎨' : '☁️'}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0 }}>{course.title}</h3>
                <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0' }}>{course.platform} • {course.duration}</p>
                <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, marginTop: 8 }}>
                  <div style={{ width: `${course.progress}%`, height: '100%', background: '#10b981', borderRadius: 3 }} />
                </div>
                <p style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>{course.progress}% complete</p>
              </div>
              <button style={{ padding: '8px 16px', background: course.progress > 0 ? '#e5e7eb' : '#8b5cf6', color: course.progress > 0 ? '#6b7280' : 'white', border: 'none', borderRadius: 8, cursor: 'pointer', height: 'fit-content' }}>
                {course.progress > 0 ? 'Continue' : 'Start'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'recommended' && (
        <div>
          <h2 style={{ marginBottom: 16 }}>Recommended for You</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {recommendations.map(rec => (
              <div key={rec.id} style={{ background: 'white', padding: 24, borderRadius: 12, textAlign: 'center' }}>
                <span style={{ fontSize: 48 }}>{rec.icon}</span>
                <h3 style={{ margin: '12px 0 4px' }}>{rec.title}</h3>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{rec.reason}</p>
                <button style={{ padding: '10px 20px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                  Enroll Free
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'all' && (
        <div>
          <h2 style={{ marginBottom: 16 }}>Browse All Courses</h2>
          <p style={{ color: '#6b7280' }}>Connect to Coursera, Udemy, LinkedIn Learning...</p>
        </div>
      )}
    </div>
  );
}

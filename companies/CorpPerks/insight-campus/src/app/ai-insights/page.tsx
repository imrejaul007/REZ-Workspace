'use client';

import { useState } from 'react';

const insights = [
  {
    type: 'skill',
    icon: '📈',
    title: 'Add AWS to your skills',
    desc: '45% of React jobs require AWS. Adding it could increase your match score by 20%.',
    action: 'Learn AWS',
  },
  {
    type: 'job',
    icon: '💼',
    title: '5 new internships match you',
    desc: 'Based on your profile, 5 new internships were posted that match 85%+ of your skills.',
    action: 'View Matches',
  },
  {
    type: 'course',
    icon: '📚',
    title: 'Complete your profile',
    desc: 'Profiles with 80%+ completion get 3x more interview requests.',
    action: 'Complete Profile',
  },
];

const recommendations = [
  { skill: 'React', progress: 75, demand: 'High', salary: '₹8-15 LPA' },
  { skill: 'TypeScript', progress: 40, demand: 'High', salary: '₹10-18 LPA' },
  { skill: 'Node.js', progress: 60, demand: 'Medium', salary: '₹6-12 LPA' },
  { skill: 'Python', progress: 30, demand: 'Very High', salary: '₹8-20 LPA' },
];

export default function AIInsightsPage() {
  const [activeTab, setActiveTab] = useState('insights');

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>🧠 AI Insights</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        Personalized recommendations powered by AI
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['insights', 'skills', 'jobs'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              background: activeTab === tab ? '#667eea' : '#e5e7eb',
              color: activeTab === tab ? 'white' : '#6b7280',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Insights */}
      {activeTab === 'insights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {insights.map((insight, i) => (
            <div key={i} style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '32px' }}>{insight.icon}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: '4px' }}>{insight.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>{insight.desc}</p>
              </div>
              <button style={{
                padding: '10px 20px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
              }}>
                {insight.action}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {activeTab === 'skills' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>Skill Demand Analysis</h2>
          {recommendations.map(skill => (
            <div key={skill.skill} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '500' }}>{skill.skill}</span>
                <span style={{ color: '#10b981', fontWeight: '600' }}>{skill.demand} demand</span>
              </div>
              <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px' }}>
                <div style={{
                  width: `${skill.progress}%`,
                  height: '100%',
                  background: '#667eea',
                  borderRadius: '4px',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '13px', color: '#6b7280' }}>
                <span>Your level: {skill.progress}%</span>
                <span>Salary: {skill.salary}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Jobs */}
      {activeTab === 'jobs' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>AI Job Matches</h2>
          <p style={{ color: '#6b7280' }}>
            Connect to REZ Intelligence API for real-time job recommendations based on your skills, career graph, and intent signals.
          </p>
          <div style={{ marginTop: '20px', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '12px' }}>Available APIs:</h4>
            <ul style={{ color: '#6b7280', fontSize: '14px', lineHeight: 2 }}>
              <li>Intent Predictor - Career intent analysis</li>
              <li>Predictive Engine - Job match scoring</li>
              <li>Insights Service - Personalized recommendations</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

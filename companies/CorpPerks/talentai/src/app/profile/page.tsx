'use client';

import { useState } from 'react';

const mockProfile = {
  name: 'Rahul Sharma',
  email: 'rahul.sharma@gmail.com',
  phone: '+91 98765 43210',
  title: 'Full Stack Developer',
  summary: 'Passionate developer with 4 years of experience in building scalable web applications using React, Node.js, and Python.',
  skills: ['React', 'Node.js', 'Python', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker'],
  experience: [
    { title: 'Senior Developer', company: 'TechCorp', period: '2022 - Present', desc: 'Building microservices architecture' },
    { title: 'Software Engineer', company: 'StartupXYZ', period: '2020 - 2022', desc: 'Full stack development' },
  ],
  education: [
    { degree: 'B.Tech Computer Science', school: 'IIT Delhi', year: '2020' },
  ],
  resumeUrl: 'Rahul_Sharma_Resume.pdf',
  linkedin: 'rahulsharma',
  github: 'rahulsharma',
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'experience'>('overview');

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: 24 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ height: 120, background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }} />
          <div style={{ padding: '0 24px 24px', position: 'relative' }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: '#8b5cf6',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontWeight: 700,
              position: 'absolute',
              top: -50,
              border: '4px solid white',
            }}>
              {mockProfile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{mockProfile.name}</h1>
                <p style={{ color: '#6b7280', margin: '4px 0 0' }}>{mockProfile.title}</p>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 14, color: '#6b7280' }}>
                  <span>📍 Bangalore</span>
                  <span>📧 {mockProfile.email}</span>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  padding: '10px 20px',
                  background: isEditing ? '#10b981' : 'white',
                  color: isEditing ? 'white' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {isEditing ? 'Save' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Profile Strength</h3>
              <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                <div style={{ width: '85%', height: '100%', background: '#8b5cf6', borderRadius: 4 }} />
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6b7280' }}>85% Complete</p>
            </div>

            <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Quick Stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Views', value: '145' },
                  { label: 'Applied', value: '23' },
                  { label: 'Interviews', value: '5' },
                  { label: 'Offers', value: '2' },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center', padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6' }}>{stat.value}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Resume</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                <span style={{ fontSize: 24 }}>📄</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{mockProfile.resumeUrl}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Updated 2 days ago</div>
                </div>
              </div>
              <button style={{ width: '100%', marginTop: 12, padding: 10, background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
                Update Resume
              </button>
            </div>
          </div>

          <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {(['overview', 'skills', 'experience'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 16px',
                    background: activeTab === tab ? '#8b5cf6' : '#f3f4f6',
                    color: activeTab === tab ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div>
                <h3 style={{ margin: '0 0 12px' }}>About Me</h3>
                <p style={{ color: '#374151', lineHeight: 1.6 }}>{mockProfile.summary}</p>

                <h3 style={{ margin: '24px 0 12px' }}>Education</h3>
                {mockProfile.education.map(edu => (
                  <div key={edu.school} style={{ padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600 }}>{edu.degree}</div>
                    <div style={{ color: '#6b7280', fontSize: 14 }}>{edu.school} • {edu.year}</div>
                  </div>
                ))}

                <h3 style={{ margin: '24px 0 12px' }}>Skills</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {mockProfile.skills.map(skill => (
                    <span key={skill} style={{ padding: '6px 12px', background: '#ede9fe', color: '#7c3aed', borderRadius: 16, fontSize: 14 }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div>
                <h3 style={{ margin: '0 0 16px' }}>Technical Skills</h3>
                {[
                  { name: 'React / Next.js', level: 90 },
                  { name: 'Node.js', level: 85 },
                  { name: 'Python', level: 80 },
                  { name: 'TypeScript', level: 82 },
                  { name: 'PostgreSQL', level: 75 },
                  { name: 'AWS', level: 70 },
                  { name: 'Docker', level: 72 },
                ].map(skill => (
                  <div key={skill.name} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{skill.name}</span>
                      <span style={{ color: '#6b7280' }}>{skill.level}%</span>
                    </div>
                    <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                      <div style={{ width: `${skill.level}%`, height: '100%', background: '#8b5cf6', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'experience' && (
              <div>
                <h3 style={{ margin: '0 0 16px' }}>Work Experience</h3>
                {mockProfile.experience.map((exp, i) => (
                  <div key={i} style={{ padding: 16, background: '#f9fafb', borderRadius: 8, marginBottom: 12, borderLeft: '3px solid #8b5cf6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 600 }}>{exp.title}</div>
                      <div style={{ color: '#6b7280', fontSize: 14 }}>{exp.period}</div>
                    </div>
                    <div style={{ color: '#8b5cf6', fontSize: 14, marginBottom: 4 }}>{exp.company}</div>
                    <p style={{ margin: 0, color: '#374151', fontSize: 14 }}>{exp.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

const mockJobs = [
  { id: '1', title: 'Senior React Developer', company: 'TechCorp', location: 'Bangalore', salary: '18-22 LPA', match: 92, skills: ['React', 'Node.js', 'TypeScript'] },
  { id: '2', title: 'ML Engineer', company: 'AI Labs', location: 'Hyderabad', salary: '25-35 LPA', match: 88, skills: ['Python', 'TensorFlow', 'MLOps'] },
  { id: '3', title: 'Full Stack Developer', company: 'WebWorks', location: 'Remote', salary: '15-20 LPA', match: 85, skills: ['React', 'Python', 'AWS'] },
];

const mockApplications = [
  { id: '1', job: 'Senior React Developer', company: 'TechCorp', status: 'interview', appliedAt: 'May 15, 2026' },
  { id: '2', job: 'Backend Engineer', company: 'DataCo', status: 'screening', appliedAt: 'May 14, 2026' },
  { id: '3', job: 'Product Designer', company: 'DesignHub', status: 'applied', appliedAt: 'May 12, 2026' },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'forYou' | 'applications' | 'interviews'>('forYou');

  const stats = [
    { label: 'Profile Views', value: '145', icon: '👁️', change: '+12%' },
    { label: 'Applications', value: '23', icon: '📤', change: '+5' },
    { label: 'Interviews', value: '8', icon: '📅', change: '+2' },
    { label: 'Offers', value: '2', icon: '🎉', change: '+1' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Welcome back, Rahul!</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>Here are your personalized job recommendations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: 24 }}>{stat.icon}</span>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{stat.value}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 14, color: '#6b7280' }}>{stat.label}</span>
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { id: 'forYou', label: 'For You', icon: '✨' },
          { id: 'applications', label: 'My Applications', icon: '📋' },
          { id: 'interviews', label: 'Interviews', icon: '📅' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab.id ? '#8b5cf6' : 'white',
              color: activeTab === tab.id ? 'white' : '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 500,
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'forYou' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Jobs Matched for You</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                AI Matched
              </button>
              <button style={{ padding: '8px 16px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                Recent
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mockJobs.map(job => (
              <div key={job.id} style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb', display: 'flex', gap: 16 }}>
                <div style={{ minWidth: 80, textAlign: 'center' }}>
                  <div style={{ background: job.match >= 90 ? '#10b981' : job.match >= 85 ? '#f59e0b' : '#6b7280', color: 'white', padding: 12, borderRadius: 10 }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{job.match}%</div>
                    <div style={{ fontSize: 10 }}>match</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16 }}>{job.title}</h3>
                      <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>{job.company} • {job.location}</p>
                    </div>
                    <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#15803d', borderRadius: 4, fontWeight: 500, fontSize: 14 }}>
                      {job.salary}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                    {job.skills.map(skill => (
                      <span key={skill} style={{ padding: '4px 8px', background: '#ede9fe', color: '#7c3aed', borderRadius: 4, fontSize: 12 }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button style={{ padding: '10px 20px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                    Apply Now
                  </button>
                  <button style={{ padding: '10px 20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: 12, color: '#6b7280', fontSize: 13 }}>Job</th>
                <th style={{ textAlign: 'left', padding: 12, color: '#6b7280', fontSize: 13 }}>Company</th>
                <th style={{ textAlign: 'left', padding: 12, color: '#6b7280', fontSize: 13 }}>Applied</th>
                <th style={{ textAlign: 'left', padding: 12, color: '#6b7280', fontSize: 13 }}>Status</th>
                <th style={{ textAlign: 'right', padding: 12, color: '#6b7280', fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockApplications.map(app => (
                <tr key={app.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 12, fontWeight: 500 }}>{app.job}</td>
                  <td style={{ padding: 12, color: '#6b7280' }}>{app.company}</td>
                  <td style={{ padding: 12, color: '#6b7280' }}>{app.appliedAt}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      padding: '4px 8px',
                      background: app.status === 'interview' ? '#dcfce7' : app.status === 'screening' ? '#fef3c7' : '#f3f4f6',
                      color: app.status === 'interview' ? '#15803d' : app.status === 'screening' ? '#92400e' : '#6b7280',
                      borderRadius: 4,
                      fontSize: 12,
                      textTransform: 'capitalize',
                    }}>
                      {app.status}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <button style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: 'white', cursor: 'pointer' }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'interviews' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            { job: 'Senior React Developer', company: 'TechCorp', date: 'May 22, 2026', time: '10:00 AM', type: 'Video Call', status: 'confirmed' },
            { job: 'Backend Engineer', company: 'DataCo', date: 'May 25, 2026', time: '2:30 PM', type: 'Phone', status: 'pending' },
          ].map((interview, i) => (
            <div key={i} style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>{interview.job}</h3>
                <span style={{
                  padding: '4px 8px',
                  background: interview.status === 'confirmed' ? '#dcfce7' : '#fef3c7',
                  color: interview.status === 'confirmed' ? '#15803d' : '#92400e',
                  borderRadius: 4,
                  fontSize: 12,
                  textTransform: 'capitalize',
                }}>
                  {interview.status}
                </span>
              </div>
              <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: 14 }}>{interview.company}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ padding: 8, background: '#f9fafb', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Date</div>
                  <div style={{ fontWeight: 500 }}>{interview.date}</div>
                </div>
                <div style={{ padding: 8, background: '#f9fafb', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Time</div>
                  <div style={{ fontWeight: 500 }}>{interview.time}</div>
                </div>
              </div>
              <div style={{ marginTop: 12, padding: 8, background: '#ede9fe', borderRadius: 6, textAlign: 'center' }}>
                <span style={{ fontSize: 14 }}>{interview.type}</span>
              </div>
              <button style={{ width: '100%', marginTop: 12, padding: 10, background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
                Join Interview
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', padding: 24, borderRadius: 12, color: 'white' }}>
        <h3 style={{ margin: '0 0 8px' }}>💡 AI Tip of the Day</h3>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Companies using AI screening see 40% faster hiring. Make sure your resume highlights measurable achievements with numbers to increase your match score!
        </p>
      </div>
    </div>
  );
}

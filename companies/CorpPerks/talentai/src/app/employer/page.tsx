'use client';

import { useState, useEffect } from 'react';

const mockJobs = [
  { id: '1', title: 'Senior React Developer', applications: 45, matches: 12, status: 'active', salary: '18-22 LPA', location: 'Bangalore', type: 'Full Time' },
  { id: '2', title: 'Product Designer', applications: 32, matches: 8, status: 'active', salary: '12-16 LPA', location: 'Mumbai', type: 'Full Time' },
  { id: '3', title: 'Data Scientist', applications: 28, matches: 15, status: 'active', salary: '20-28 LPA', location: 'Hyderabad', type: 'Full Time' },
  { id: '4', title: 'DevOps Engineer', applications: 18, matches: 6, status: 'paused', salary: '16-20 LPA', location: 'Remote', type: 'Full Time' },
  { id: '5', title: 'Frontend Intern', applications: 56, matches: 20, status: 'active', salary: '25K/mo', location: 'Bangalore', type: 'Internship' },
];

const mockCandidates = [
  { id: '1', name: 'Priya Sharma', role: 'React Developer', match: 92, skills: ['React', 'Node.js', 'TypeScript'], location: 'Bangalore', experience: '3 years', applied: '2 days ago' },
  { id: '2', name: 'Rahul Verma', role: 'Full Stack Developer', match: 88, skills: ['Python', 'Django', 'React'], location: 'Remote', experience: '4 years', applied: '3 days ago' },
  { id: '3', name: 'Anita Desai', role: 'UI/UX Designer', match: 85, skills: ['Figma', 'Sketch', 'CSS'], location: 'Mumbai', experience: '2 years', applied: '1 day ago' },
  { id: '4', name: 'Vikram Singh', role: 'ML Engineer', match: 90, skills: ['Python', 'TensorFlow', 'AWS'], location: 'Hyderabad', experience: '5 years', applied: '5 days ago' },
  { id: '5', name: 'Sneha Patel', role: 'Frontend Developer', match: 87, skills: ['React', 'Vue.js', 'Tailwind'], location: 'Pune', experience: '2 years', applied: '1 week ago' },
  { id: '6', name: 'Arjun Nair', role: 'Backend Developer', match: 82, skills: ['Node.js', 'MongoDB', 'Redis'], location: 'Bangalore', experience: '3 years', applied: '4 days ago' },
];

export default function EmployerPage() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates' | 'analytics'>('jobs');
  const [showPostJob, setShowPostJob] = useState(false);
  const [jobs, setJobs] = useState(mockJobs);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState<typeof mockCandidates[0] | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'Active Jobs', value: jobs.filter(j => j.status === 'active').length, icon: '💼', change: '+2' },
    { label: 'Total Candidates', value: mockCandidates.length, icon: '👥', change: '+12' },
    { label: 'Interviews Scheduled', value: 18, icon: '📅', change: '+5' },
    { label: 'Hires This Month', value: 5, icon: '✅', change: '+2' },
  ];

  const handlePostJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const newJob = {
      id: String(jobs.length + 1),
      title: formData.get('title') as string,
      applications: 0,
      matches: 0,
      status: 'active',
      salary: `${formData.get('minSalary')} - ${formData.get('maxSalary')} LPA`,
      location: formData.get('location') as string,
      type: formData.get('type') as string,
    };

    setJobs([newJob, ...jobs]);
    setShowPostJob(false);
    form.reset();
  };

  const handleCandidateClick = (candidate: typeof mockCandidates[0]) => {
    setSelectedCandidate(candidate);
    setShowCandidateModal(true);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Employer Dashboard</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Manage your job postings and candidates</p>
        </div>
        <button
          onClick={() => setShowPostJob(true)}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          + Post New Job
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: 28 }}>{stat.icon}</span>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{stat.value}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 14, color: '#6b7280' }}>{stat.label}</span>
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { id: 'jobs', label: 'My Jobs', icon: '💼' },
          { id: 'candidates', label: 'Top Candidates', icon: '⭐' },
          { id: 'analytics', label: 'Analytics', icon: '📊' },
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

      {activeTab === 'jobs' && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ margin: 0 }}>Your Job Postings ({filteredJobs.length})</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6 }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6 }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ textAlign: 'left', padding: 12, fontSize: 13, color: '#6b7280' }}>Job Title</th>
                  <th style={{ textAlign: 'center', padding: 12, fontSize: 13, color: '#6b7280' }}>Location</th>
                  <th style={{ textAlign: 'center', padding: 12, fontSize: 13, color: '#6b7280' }}>Salary</th>
                  <th style={{ textAlign: 'center', padding: 12, fontSize: 13, color: '#6b7280' }}>Applications</th>
                  <th style={{ textAlign: 'center', padding: 12, fontSize: 13, color: '#6b7280' }}>AI Matches</th>
                  <th style={{ textAlign: 'center', padding: 12, fontSize: 13, color: '#6b7280' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: 12, fontSize: 13, color: '#6b7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => (
                  <tr key={job.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 500 }}>{job.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{job.type}</div>
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>{job.location}</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>{job.salary}</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>{job.applications}</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <span style={{ padding: '4px 8px', background: '#dcfce7', color: '#15803d', borderRadius: 4, fontWeight: 500 }}>
                        {job.matches} ✓
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        background: job.status === 'active' ? '#dcfce7' : '#fef3c7',
                        color: job.status === 'active' ? '#15803d' : '#92400e',
                        borderRadius: 4,
                        fontSize: 12,
                        textTransform: 'capitalize',
                      }}>
                        {job.status}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: 'white', cursor: 'pointer', marginRight: 8 }}>
                        View
                      </button>
                      <button style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: 'white', cursor: 'pointer' }}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'candidates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {mockCandidates.map(candidate => (
            <div
              key={candidate.id}
              style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb', cursor: 'pointer' }}
              onClick={() => handleCandidateClick(candidate)}
            >
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{candidate.name}</h3>
                    <span style={{ padding: '4px 8px', background: '#dcfce7', color: '#15803d', borderRadius: 4, fontWeight: 600, fontSize: 12 }}>
                      {candidate.match}% Match
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 8px', color: '#6b7280', fontSize: 14 }}>{candidate.role}</p>
                  <div style={{ display: 'flex', gap: 8, fontSize: 13, color: '#6b7280' }}>
                    <span>📍 {candidate.location}</span>
                    <span>💼 {candidate.experience}</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {candidate.skills.map(skill => (
                  <span key={skill} style={{ padding: '4px 8px', background: '#ede9fe', color: '#7c3aed', borderRadius: 4, fontSize: 12 }}>
                    {skill}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button style={{ flex: 1, padding: '8px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
                  Schedule Interview
                </button>
                <button style={{ flex: 1, padding: '8px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}>
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 16px' }}>Hiring Pipeline</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              {['Applied', 'Screening', 'Interview', 'Offer', 'Hired'].map((stage, i) => (
                <div key={stage} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    height: 80,
                    background: ['#e5e7eb', '#c4b5fd', '#a78bfa', '#8b5cf6', '#10b981'][i],
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: i < 3 ? '#374151' : 'white',
                    fontWeight: 700,
                    fontSize: 18,
                  }}>
                    {[247, 98, 45, 12, 5][i]}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>{stage}</div>
                </div>
              ))}
            </div>
            <h4 style={{ margin: '16px 0 8px' }}>Weekly Applications</h4>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 100 }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={day} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: [40, 60, 50, 70, 85, 30, 15][i], background: '#8b5cf6', borderRadius: '4px 4px 0 0' }} />
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>{day}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <h4 style={{ margin: '0 0 12px' }}>Top Skills in Demand</h4>
              {[
                { skill: 'React', count: 45 },
                { skill: 'Python', count: 38 },
                { skill: 'Node.js', count: 32 },
                { skill: 'AWS', count: 28 },
                { skill: 'SQL', count: 25 },
              ].map((s, i) => (
                <div key={s.skill} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 20, height: 20, background: '#8b5cf6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700 }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1 }}>{s.skill}</span>
                  <span style={{ color: '#6b7280', fontSize: 13 }}>{s.count}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <h4 style={{ margin: '0 0 12px' }}>Time to Hire</h4>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: '#8b5cf6' }}>18</span>
                <span style={{ fontSize: 16, color: '#6b7280' }}> days avg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPostJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>Post New Job</h2>
              <button onClick={() => setShowPostJob(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handlePostJob} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Job Title *</label>
                <input name="title" type="text" placeholder="e.g., Senior Developer" required style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Description *</label>
                <textarea name="description" rows={4} placeholder="Job description..." required style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 6 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Location *</label>
                  <input name="location" type="text" placeholder="City or Remote" required style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Job Type *</label>
                  <select name="type" required style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Required Skills</label>
                <input name="skills" type="text" placeholder="Comma-separated skills" style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 6 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Min Salary (LPA)</label>
                  <input name="minSalary" type="number" placeholder="e.g., 10" style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Max Salary (LPA)</label>
                  <input name="maxSalary" type="number" placeholder="e.g., 20" style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                </div>
              </div>
              <button type="submit" style={{ padding: 12, background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginTop: 8 }}>
                Post Job
              </button>
            </form>
          </div>
        </div>
      )}

      {showCandidateModal && selectedCandidate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 16, width: '100%', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>Candidate Details</h2>
              <button onClick={() => setShowCandidateModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700 }}>
                {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 20 }}>{selectedCandidate.name}</h3>
                <p style={{ margin: '4px 0 0', color: '#6b7280' }}>{selectedCandidate.role}</p>
                <span style={{ display: 'inline-block', padding: '4px 8px', background: '#dcfce7', color: '#15803d', borderRadius: 4, fontWeight: 600, marginTop: 8 }}>
                  {selectedCandidate.match}% Match
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Location</div>
                <div style={{ fontWeight: 500 }}>{selectedCandidate.location}</div>
              </div>
              <div style={{ padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Experience</div>
                <div style={{ fontWeight: 500 }}>{selectedCandidate.experience}</div>
              </div>
              <div style={{ padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Applied</div>
                <div style={{ fontWeight: 500 }}>{selectedCandidate.applied}</div>
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 12px' }}>Skills</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selectedCandidate.skills.map(skill => (
                  <span key={skill} style={{ padding: '6px 12px', background: '#ede9fe', color: '#7c3aed', borderRadius: 16 }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{ flex: 1, padding: 12, background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Schedule Interview
              </button>
              <button style={{ flex: 1, padding: 12, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
                Download Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

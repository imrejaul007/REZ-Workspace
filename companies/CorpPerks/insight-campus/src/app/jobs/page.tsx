'use client';

import { useState, useEffect } from 'react';
import { getJobs, Job, POPULAR_SKILLS } from '@/services/api';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showSkillPicker, setShowSkillPicker] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getJobs();
      setJobs(result.jobs.length > 0 ? result.jobs : getMockJobs());
    } catch (err) {
      setError('Failed to load jobs. Showing demo data.');
      setJobs(getMockJobs());
    }
    setLoading(false);
  };

  const getMockJobs = (): Job[] => [
    {
      _id: '1',
      title: 'Software Developer',
      description: 'Build scalable web applications',
      skills: ['React', 'Node.js', 'TypeScript'],
      type: 'full_time',
      location: { city: 'Bangalore', remote: false, hybrid: true },
      salary: { min: 800000, max: 1200000, period: 'year' },
      employer: { id: '1', name: 'TechCorp', type: 'Startup', verified: true },
      postedAt: '2026-05-15',
      applications: 45,
      matchScore: 92,
    },
    {
      _id: '2',
      title: 'Data Analyst Intern',
      description: 'Analyze data and create reports',
      skills: ['Python', 'SQL', 'Excel'],
      type: 'internship',
      location: { city: 'Remote', remote: true, hybrid: false },
      salary: { min: 15000, max: 20000, period: 'month' },
      employer: { id: '2', name: 'DataCo', type: 'Enterprise', verified: true },
      postedAt: '2026-05-18',
      applications: 128,
      matchScore: 88,
    },
    {
      _id: '3',
      title: 'Product Designer',
      description: 'Design beautiful user interfaces',
      skills: ['Figma', 'UI/UX', 'Prototyping'],
      type: 'full_time',
      location: { city: 'Mumbai', remote: false, hybrid: false },
      salary: { min: 1000000, max: 1500000, period: 'year' },
      employer: { id: '3', name: 'DesignHub', type: 'Agency', verified: false },
      postedAt: '2026-05-17',
      applications: 67,
      matchScore: 85,
    },
    {
      _id: '4',
      title: 'Marketing Associate',
      description: 'Drive marketing campaigns',
      skills: ['Digital Marketing', 'Social Media', 'Analytics'],
      type: 'full_time',
      location: { city: 'Delhi', remote: false, hybrid: true },
      salary: { min: 600000, max: 800000, period: 'year' },
      employer: { id: '4', name: 'BrandMax', type: 'Startup', verified: true },
      postedAt: '2026-05-19',
      applications: 89,
      matchScore: 78,
    },
    {
      _id: '5',
      title: 'Frontend Engineer',
      description: 'Build React applications',
      skills: ['React', 'Next.js', 'Tailwind'],
      type: 'full_time',
      location: { city: 'Bangalore', remote: false, hybrid: true },
      salary: { min: 1200000, max: 1800000, period: 'year' },
      employer: { id: '5', name: 'WebWorks', type: 'Startup', verified: true },
      postedAt: '2026-05-20',
      applications: 34,
      matchScore: 95,
    },
    {
      _id: '6',
      title: 'ML Engineer',
      description: 'Build ML models for production',
      skills: ['Python', 'TensorFlow', 'MLOps'],
      type: 'full_time',
      location: { city: 'Hyderabad', remote: true, hybrid: false },
      salary: { min: 1500000, max: 2500000, period: 'year' },
      employer: { id: '6', name: 'AI Labs', type: 'Research', verified: true },
      postedAt: '2026-05-14',
      applications: 23,
      matchScore: 82,
    },
  ];

  const filtered = jobs.filter(job => {
    const matchesType = filter === 'all' || job.type === filter;
    const matchesSearch = !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.employer.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkills = selectedSkills.length === 0 ||
      selectedSkills.some(skill => job.skills.includes(skill));
    return matchesType && matchesSearch && matchesSkills;
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const formatSalary = (salary?: Job['salary']) => {
    if (!salary) return 'Not disclosed';
    if (salary.period === 'month') {
      return `₹${(salary.min / 1000).toFixed(0)}-${(salary.max / 1000).toFixed(0)}K/mo`;
    }
    return `₹${(salary.min / 100000).toFixed(1)}-${(salary.max / 100000).toFixed(1)} LPA`;
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>💼 Jobs</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ background: 'white', padding: 20, borderRadius: 12, height: 100, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>💼 Jobs</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Find internships and entry-level opportunities</p>

      {error && (
        <div style={{ padding: 12, background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, marginBottom: 16, color: '#92400e' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search jobs or companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 14,
          }}
        />
        <button
          onClick={() => setShowSkillPicker(!showSkillPicker)}
          style={{
            padding: '12px 16px',
            background: selectedSkills.length > 0 ? '#10b981' : 'white',
            color: selectedSkills.length > 0 ? 'white' : '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Skills ({selectedSkills.length})
        </button>
      </div>

      {showSkillPicker && (
        <div style={{ background: 'white', padding: 16, borderRadius: 12, marginBottom: 16, border: '1px solid #e5e7eb' }}>
          <h4 style={{ marginBottom: 12 }}>Select Skills</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {POPULAR_SKILLS.map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                style={{
                  padding: '6px 12px',
                  background: selectedSkills.includes(skill) ? '#10b981' : '#f3f4f6',
                  color: selectedSkills.includes(skill) ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: 16,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {skill}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button
              onClick={() => setSelectedSkills([])}
              style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 6, background: 'white', cursor: 'pointer' }}
            >
              Clear
            </button>
            <button
              onClick={() => setShowSkillPicker(false)}
              style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { value: 'all', label: 'All' },
          { value: 'full_time', label: 'Full Time' },
          { value: 'internship', label: 'Internship' },
          { value: 'part_time', label: 'Part Time' },
          { value: 'contract', label: 'Contract' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: 20,
            cursor: 'pointer',
            fontWeight: 500,
            background: filter === f.value ? '#8b5cf6' : '#e5e7eb',
            color: filter === f.value ? 'white' : '#6b7280',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      <p style={{ color: '#6b7280', marginBottom: 12 }}>{filtered.length} jobs found</p>

      {filtered.map(job => (
        <div key={job._id} style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 12, display: 'flex', gap: 16, alignItems: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ minWidth: 80, textAlign: 'center' }}>
            <div style={{ background: job.matchScore && job.matchScore >= 85 ? '#10b981' : '#f59e0b', color: 'white', padding: 12, borderRadius: 10 }}>
              <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{job.matchScore}%</p>
              <p style={{ fontSize: 10, margin: 0 }}>match</p>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0 }}>{job.title}</h3>
              {job.employer.verified && (
                <span style={{ fontSize: 14 }}>✓</span>
              )}
            </div>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0' }}>
              {job.employer.name} • {job.location.city}
              {job.location.remote && ' • Remote'}
              {job.location.hybrid && ' • Hybrid'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              <span style={{ padding: '4px 10px', background: '#f3f4f6', borderRadius: 12, fontSize: 12 }}>
                {job.type.replace('_', ' ')}
              </span>
              <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#15803d', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>
                {formatSalary(job.salary)}
              </span>
              {job.skills.slice(0, 3).map(skill => (
                <span key={skill} style={{ padding: '4px 10px', background: '#ede9fe', color: '#7c3aed', borderRadius: 12, fontSize: 12 }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <button style={{ padding: '10px 20px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
            Apply
          </button>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, background: 'white', borderRadius: 12 }}>
          <span style={{ fontSize: 48 }}>🔍</span>
          <h3>No jobs found</h3>
          <p style={{ color: '#6b7280' }}>Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}

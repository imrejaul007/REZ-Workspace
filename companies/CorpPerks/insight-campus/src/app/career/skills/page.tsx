'use client';

import { useState } from 'react';

const skillCategories = [
  {
    name: 'Programming',
    skills: [
      { name: 'JavaScript', level: 90, jobs: 245 },
      { name: 'Python', level: 85, jobs: 198 },
      { name: 'Java', level: 75, jobs: 156 },
      { name: 'TypeScript', level: 80, jobs: 142 },
      { name: 'C++', level: 70, jobs: 98 },
      { name: 'Go', level: 65, jobs: 87 },
    ],
  },
  {
    name: 'Frontend',
    skills: [
      { name: 'React', level: 88, jobs: 210 },
      { name: 'Angular', level: 65, jobs: 95 },
      { name: 'Vue.js', level: 60, jobs: 78 },
      { name: 'Next.js', level: 75, jobs: 132 },
      { name: 'CSS/SCSS', level: 82, jobs: 145 },
      { name: 'Tailwind', level: 70, jobs: 110 },
    ],
  },
  {
    name: 'Backend',
    skills: [
      { name: 'Node.js', level: 85, jobs: 189 },
      { name: 'Django', level: 72, jobs: 105 },
      { name: 'Spring Boot', level: 68, jobs: 92 },
      { name: 'Express', level: 80, jobs: 156 },
      { name: 'FastAPI', level: 60, jobs: 67 },
      { name: 'Ruby on Rails', level: 55, jobs: 45 },
    ],
  },
  {
    name: 'Database',
    skills: [
      { name: 'SQL', level: 82, jobs: 178 },
      { name: 'MongoDB', level: 78, jobs: 145 },
      { name: 'PostgreSQL', level: 75, jobs: 132 },
      { name: 'Redis', level: 65, jobs: 98 },
      { name: 'MySQL', level: 80, jobs: 165 },
      { name: 'DynamoDB', level: 55, jobs: 72 },
    ],
  },
  {
    name: 'Cloud & DevOps',
    skills: [
      { name: 'AWS', level: 80, jobs: 220 },
      { name: 'Docker', level: 75, jobs: 165 },
      { name: 'Kubernetes', level: 65, jobs: 112 },
      { name: 'GCP', level: 60, jobs: 85 },
      { name: 'Azure', level: 58, jobs: 78 },
      { name: 'Terraform', level: 55, jobs: 65 },
    ],
  },
  {
    name: 'AI & Data',
    skills: [
      { name: 'Machine Learning', level: 75, jobs: 155 },
      { name: 'TensorFlow', level: 70, jobs: 98 },
      { name: 'PyTorch', level: 68, jobs: 89 },
      { name: 'Data Science', level: 72, jobs: 125 },
      { name: 'NLP', level: 60, jobs: 72 },
      { name: 'Computer Vision', level: 55, jobs: 58 },
    ],
  },
];

const trendingSkills = [
  { name: 'Generative AI', growth: '+45%', demand: 'High' },
  { name: 'LangChain', growth: '+38%', demand: 'High' },
  { name: 'Rust', growth: '+32%', demand: 'Medium' },
  { name: 'Web3', growth: '+28%', demand: 'Medium' },
  { name: 'Edge Computing', growth: '+25%', demand: 'Medium' },
  { name: 'Quantum Computing', growth: '+20%', demand: 'Low' },
];

const careerPaths = [
  {
    title: 'Frontend Developer',
    skills: ['HTML/CSS', 'JavaScript', 'React', 'TypeScript', 'Git'],
    salary: '₹6-18 LPA',
    demand: 'High',
  },
  {
    title: 'Backend Developer',
    skills: ['Node.js', 'Python', 'SQL', 'Redis', 'Docker'],
    salary: '₹8-22 LPA',
    demand: 'High',
  },
  {
    title: 'Full Stack Developer',
    skills: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'TypeScript'],
    salary: '₹10-25 LPA',
    demand: 'Very High',
  },
  {
    title: 'DevOps Engineer',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD'],
    salary: '₹12-28 LPA',
    demand: 'High',
  },
  {
    title: 'Data Scientist',
    skills: ['Python', 'ML', 'TensorFlow', 'SQL', 'Statistics'],
    salary: '₹10-30 LPA',
    demand: 'Very High',
  },
  {
    title: 'ML Engineer',
    skills: ['Python', 'PyTorch', 'MLOps', 'AWS', 'Deep Learning'],
    salary: '₹15-40 LPA',
    demand: 'Very High',
  },
];

export default function SkillsPage() {
  const [selectedCategory, setSelectedCategory] = useState('Programming');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'skills' | 'paths'>('skills');

  const filteredSkills = skillCategories.find(c => c.name === selectedCategory)?.skills || [];
  const searchResults = searchQuery
    ? skillCategories.flatMap(c => c.skills).filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Skills & Career Paths</h1>
        <p style={{ color: '#6b7280' }}>
          Explore in-demand skills, track your progress, and discover career paths
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search for any skill..."
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
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 4 }}>
          <button
            onClick={() => setViewMode('skills')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              background: viewMode === 'skills' ? 'white' : 'transparent',
              cursor: 'pointer',
              fontWeight: 500,
              boxShadow: viewMode === 'skills' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Skills
          </button>
          <button
            onClick={() => setViewMode('paths')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              background: viewMode === 'paths' ? 'white' : 'transparent',
              cursor: 'pointer',
              fontWeight: 500,
              boxShadow: viewMode === 'paths' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Career Paths
          </button>
        </div>
      </div>

      {searchQuery && searchResults.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginBottom: 12 }}>Search Results for "{searchQuery}"</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {searchResults.map(skill => (
              <div key={skill.name} style={{ padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                <div style={{ fontWeight: 600 }}>{skill.name}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                  {skill.level}% proficiency • {skill.jobs} jobs
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'skills' && !searchQuery && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {skillCategories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                style={{
                  padding: '8px 16px',
                  background: selectedCategory === cat.name ? '#10b981' : 'white',
                  color: selectedCategory === cat.name ? 'white' : '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {filteredSkills.map(skill => (
              <div key={skill.name} style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>{skill.name}</span>
                  <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>{skill.jobs} jobs</span>
                </div>
                <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }}>
                  <div style={{ width: `${skill.level}%`, height: '100%', background: '#10b981', borderRadius: 4 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                  <span>Your level: {skill.level}%</span>
                  <span>Market avg: {skill.level - 5}%</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
            <h2 style={{ marginBottom: 16 }}>🔥 Trending Skills in 2026</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {trendingSkills.map(skill => (
                <div key={skill.name} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: '#fef3c7', borderRadius: 8 }}>
                  <span style={{ fontWeight: 500 }}>{skill.name}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#059669', fontWeight: 600 }}>{skill.growth}</span>
                    <div style={{ fontSize: 11, color: '#92400e' }}>{skill.demand}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {viewMode === 'paths' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {careerPaths.map(path => (
            <div key={path.title} style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{path.title}</h3>
                <span style={{
                  padding: '4px 8px',
                  background: path.demand === 'Very High' ? '#fef3c7' : '#ecfdf5',
                  color: path.demand === 'Very High' ? '#92400e' : '#059669',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                }}>
                  {path.demand} Demand
                </span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{path.salary}</span>
                <span style={{ color: '#6b7280', fontSize: 13 }}> avg</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {path.skills.map(skill => (
                  <span key={skill} style={{ padding: '4px 8px', background: '#f3f4f6', borderRadius: 4, fontSize: 12 }}>
                    {skill}
                  </span>
                ))}
              </div>
              <button style={{
                marginTop: 16,
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
                width: '100%',
              }}>
                Start Learning Path
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

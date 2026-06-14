'use client';

import { useState } from 'react';

const insights = {
  marketTrend: [
    { month: 'Jan', jobs: 1200, applications: 3400 },
    { month: 'Feb', jobs: 1350, applications: 3800 },
    { month: 'Mar', jobs: 1420, applications: 4100 },
    { month: 'Apr', jobs: 1380, applications: 3900 },
    { month: 'May', jobs: 1550, applications: 4500 },
  ],
  topSkills: [
    { skill: 'React', demand: 95, salary: 18 },
    { skill: 'Python', demand: 92, salary: 16 },
    { skill: 'Node.js', demand: 88, salary: 15 },
    { skill: 'AWS', demand: 85, salary: 20 },
    { skill: 'TypeScript', demand: 82, salary: 17 },
    { skill: 'Docker', demand: 78, salary: 18 },
    { skill: 'Machine Learning', demand: 75, salary: 22 },
    { skill: 'Go', demand: 72, salary: 19 },
  ],
  salaryRanges: [
    { role: 'Frontend Developer', min: 8, max: 18, avg: 12 },
    { role: 'Backend Developer', min: 10, max: 22, avg: 15 },
    { role: 'Full Stack', min: 12, max: 25, avg: 17 },
    { role: 'DevOps Engineer', min: 15, max: 28, avg: 20 },
    { role: 'Data Scientist', min: 12, max: 30, avg: 18 },
    { role: 'ML Engineer', min: 18, max: 40, avg: 25 },
  ],
  companies: [
    { name: 'Google', openings: 245, growth: 15 },
    { name: 'Microsoft', openings: 198, growth: 12 },
    { name: 'Amazon', openings: 312, growth: 8 },
    { name: 'Meta', openings: 156, growth: 18 },
    { name: 'Netflix', openings: 89, growth: 5 },
  ],
};

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<'market' | 'skills' | 'salary' | 'companies'>('market');

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>📊 Talent Insights</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>AI-powered market intelligence and trends</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Active Jobs', value: '12,450', change: '+12%', icon: '💼' },
          { label: 'Avg Salary', value: '₹18.5 L', change: '+5%', icon: '💰' },
          { label: 'New Today', value: '342', change: '+18', icon: '🆕' },
          { label: 'Companies Hiring', value: '1,245', change: '+8%', icon: '🏢' },
        ].map(stat => (
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
          { id: 'market', label: 'Market Trend', icon: '📈' },
          { id: 'skills', label: 'Skills Demand', icon: '🎯' },
          { id: 'salary', label: 'Salary Data', icon: '💵' },
          { id: 'companies', label: 'Top Companies', icon: '🏢' },
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

      {activeTab === 'market' && (
        <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 24px' }}>Job Postings vs Applications (2026)</h3>
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', height: 200 }}>
            {insights.marketTrend.map(item => (
              <div key={item.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 160 }}>
                  <div style={{ width: 24, background: '#8b5cf6', borderRadius: '4px 4px 0 0', height: `${(item.jobs / 1600) * 100}%` }} />
                  <div style={{ width: 24, background: '#10b981', borderRadius: '4px 4px 0 0', height: `${(item.applications / 5000) * 100}%` }} />
                </div>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{item.month}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, background: '#8b5cf6', borderRadius: 2 }} />
              <span style={{ fontSize: 13, color: '#6b7280' }}>Job Postings</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, background: '#10b981', borderRadius: 2 }} />
              <span style={{ fontSize: 13, color: '#6b7280' }}>Applications</span>
            </div>
          </div>

          <div style={{ marginTop: 32, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
            <h4 style={{ margin: '0 0 8px' }}>AI Insight</h4>
            <p style={{ margin: 0, color: '#374151', fontSize: 14 }}>
              📈 Job postings increased by 12% this month. The React and Python ecosystems show the highest demand, with companies offering 15-20% salary premiums for candidates with cloud experience.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 16px' }}>Skills in Demand</h3>
            {insights.topSkills.map(skill => (
              <div key={skill.skill} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{skill.skill}</span>
                  <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{skill.demand}%</span>
                </div>
                <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                  <div style={{ width: `${skill.demand}%`, height: '100%', background: skill.demand > 85 ? '#10b981' : skill.demand > 75 ? '#8b5cf6' : '#6b7280', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 16px' }}>Emerging Skills</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { name: 'Generative AI / LLM', growth: '+45%', salary: 35 },
                { name: 'LangChain', growth: '+38%', salary: 30 },
                { name: 'Rust', growth: '+32%', salary: 28 },
                { name: 'Web3 / Blockchain', growth: '+25%', salary: 25 },
                { name: 'Edge Computing', growth: '+22%', salary: 24 },
              ].map(skill => (
                <div key={skill.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#fef3c7', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{skill.name}</div>
                    <div style={{ fontSize: 12, color: '#92400e' }}>{skill.growth} growth</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: '#10b981' }}>₹{skill.salary}+ L</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>avg</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'salary' && (
        <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 16px' }}>Salary Ranges by Role (LPA)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: 12, color: '#6b7280', fontSize: 13 }}>Role</th>
                <th style={{ textAlign: 'right', padding: 12, color: '#6b7280', fontSize: 13 }}>Min</th>
                <th style={{ textAlign: 'right', padding: 12, color: '#6b7280', fontSize: 13 }}>Average</th>
                <th style={{ textAlign: 'right', padding: 12, color: '#6b7280', fontSize: 13 }}>Max</th>
                <th style={{ textAlign: 'left', padding: 12, color: '#6b7280', fontSize: 13 }}>Range</th>
              </tr>
            </thead>
            <tbody>
              {insights.salaryRanges.map(row => (
                <tr key={row.role} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 12, fontWeight: 500 }}>{row.role}</td>
                  <td style={{ padding: 12, textAlign: 'right', color: '#10b981' }}>₹{row.min} L</td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>₹{row.avg} L</td>
                  <td style={{ padding: 12, textAlign: 'right', color: '#8b5cf6' }}>₹{row.max} L</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: `${((row.min - 5) / 40) * 100}%`, width: `${((row.max - row.min) / 40) * 100}%`, height: '100%', background: '#8b5cf6', borderRadius: 4 }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'companies' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 16px' }}>Top Hiring Companies</h3>
            {insights.companies.map((company, i) => (
              <div key={company.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8, background: '#f9fafb', borderRadius: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{company.name}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{company.openings} openings</div>
                </div>
                <span style={{ padding: '4px 8px', background: '#dcfce7', color: '#15803d', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>
                  +{company.growth}%
                </span>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 16px' }}>Company Insights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { company: 'Google', insight: 'Highest paying for ML roles, 25% premium over market' },
                { company: 'Amazon', insight: 'Fastest hiring process, avg 12 days to offer' },
                { company: 'Microsoft', insight: 'Best work-life balance scores in surveys' },
                { company: 'Meta', insight: 'Highest growth in hiring, focus on AI/VR' },
              ].map(item => (
                <div key={item.company} style={{ padding: 12, background: '#ede9fe', borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, color: '#7c3aed', marginBottom: 4 }}>{item.company}</div>
                  <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>{item.insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';

const companies = [
  { id: '1', name: 'Google', logo: '🔍', industry: 'Technology', jobs: 245, locations: ['Bangalore', 'Hyderabad', 'Mumbai'], benefits: ['Stock Options', 'Health Insurance', 'Free Food'], rating: 4.5, growth: '+15%' },
  { id: '2', name: 'Microsoft', logo: '🪟', industry: 'Technology', jobs: 198, locations: ['Bangalore', 'Pune'], benefits: ['Remote Work', 'Learning Budget', 'Wellness'], rating: 4.4, growth: '+12%' },
  { id: '3', name: 'Amazon', logo: '📦', industry: 'E-Commerce', jobs: 312, locations: ['Bangalore', 'Chennai', 'Hyderabad'], benefits: ['ESOP', 'Health Insurance', 'Parental Leave'], rating: 4.2, growth: '+8%' },
  { id: '4', name: 'Meta', logo: '💬', industry: 'Social Media', jobs: 156, locations: ['Bangalore', 'Hyderabad'], benefits: ['Free Gym', 'Stock Options', 'Sabbatical'], rating: 4.3, growth: '+18%' },
  { id: '5', name: 'Netflix', logo: '🎬', industry: 'Entertainment', jobs: 89, locations: ['Mumbai'], benefits: ['Unlimited PTO', 'No Meeting Fridays', 'Top Pay'], rating: 4.6, growth: '+5%' },
  { id: '6', name: 'Adobe', logo: '🎨', industry: 'Software', jobs: 124, locations: ['Bangalore', 'Noida'], benefits: ['Creative Freedom', 'Health Insurance', 'Sabbatical'], rating: 4.4, growth: '+10%' },
  { id: '7', name: 'Salesforce', logo: '☁️', industry: 'SaaS', jobs: 178, locations: ['Bangalore', 'Hyderabad'], benefits: ['Volunteer Days', 'Education', 'Health'], rating: 4.3, growth: '+14%' },
  { id: '8', name: 'Oracle', logo: '🗄️', industry: 'Enterprise', jobs: 210, locations: ['Bangalore', 'Noida', 'Pune'], benefits: ['Job Security', 'Training', 'Benefits'], rating: 4.1, growth: '+6%' },
];

const features = ['Top Brands', 'AI Matched', 'Verified Reviews', 'Direct Apply'];

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [sortBy, setSortBy] = useState('jobs');

  const industries = ['all', ...new Set(companies.map(c => c.industry))];

  const filtered = companies
    .filter(c => selectedIndustry === 'all' || c.industry === selectedIndustry)
    .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'jobs') return b.jobs - a.jobs;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>🏢 Companies</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>Explore top companies hiring on TalentAI</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {features.map(feature => (
          <span key={feature} style={{ padding: '6px 12px', background: '#ede9fe', color: '#7c3aed', borderRadius: 16, fontSize: 13 }}>
            {feature}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}
        />
        <select
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          style={{ padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}
        >
          {industries.map(ind => (
            <option key={ind} value={ind}>
              {ind === 'all' ? 'All Industries' : ind}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}
        >
          <option value="jobs">Most Jobs</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {filtered.map(company => (
          <div key={company.id} style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 64, height: 64, background: '#f3f4f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                {company.logo}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{company.name}</h3>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>{company.industry}</p>
                  </div>
                  <span style={{ padding: '4px 8px', background: '#dcfce7', color: '#15803d', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>
                    {company.growth}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, color: '#6b7280' }}>
                  <span>💼 {company.jobs} jobs</span>
                  <span>⭐ {company.rating}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Locations</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {company.locations.map(loc => (
                    <span key={loc} style={{ padding: '4px 8px', background: '#f3f4f6', borderRadius: 4, fontSize: 12 }}>
                      {loc}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Benefits</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {company.benefits.map(benefit => (
                    <span key={benefit} style={{ padding: '4px 8px', background: '#dcfce7', color: '#15803d', borderRadius: 4, fontSize: 12 }}>
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, padding: '10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
                View Jobs
              </button>
              <button style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}>
                Company Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, background: 'white', borderRadius: 12 }}>
          <span style={{ fontSize: 48 }}>🔍</span>
          <h3>No companies found</h3>
          <p style={{ color: '#6b7280' }}>Try adjusting your search or filters</p>
        </div>
      )}

      <div style={{ marginTop: 32, background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', padding: 24, borderRadius: 12, color: 'white', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 8px' }}>Want to showcase your company?</h3>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Join 500+ companies finding top talent with AI-powered matching
        </p>
        <button style={{ marginTop: 16, padding: '12px 24px', background: 'white', color: '#8b5cf6', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          Post a Job
        </button>
      </div>
    </div>
  );
}

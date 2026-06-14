'use client';

import { useState } from 'react';
import styles from './page.module.css';

const mockJobs = [
  {
    id: '1',
    title: 'Frontend Developer Intern',
    company: 'TechCorp India',
    logo: '🏢',
    location: 'Bangalore, Karnataka',
    type: 'Internship',
    duration: '6 months',
    salary: '₹25,000/month',
    match: 92,
    skills: ['React', 'JavaScript', 'CSS'],
    posted: '2 days ago',
    description: 'Join our frontend team to build amazing user interfaces...',
  },
  {
    id: '2',
    title: 'React Developer',
    company: 'StartupXYZ',
    logo: '🚀',
    location: 'Remote',
    type: 'Full Time',
    salary: '₹8 LPA',
    match: 88,
    skills: ['React', 'TypeScript', 'Node.js'],
    posted: '1 day ago',
    description: 'Looking for experienced React developers...',
  },
  {
    id: '3',
    title: 'ML Engineer Intern',
    company: 'AI Labs',
    logo: '🤖',
    location: 'Hyderabad, Telangana',
    type: 'Internship',
    duration: '3 months',
    salary: '₹30,000/month',
    match: 85,
    skills: ['Python', 'Machine Learning', 'TensorFlow'],
    posted: '3 days ago',
    description: 'Work on cutting-edge ML projects...',
  },
  {
    id: '4',
    title: 'Product Designer',
    company: 'DesignHub',
    logo: '🎨',
    location: 'Mumbai, Maharashtra',
    type: 'Full Time',
    salary: '₹12 LPA',
    match: 78,
    skills: ['Figma', 'UI/UX', 'Prototyping'],
    posted: '5 days ago',
    description: 'Create beautiful and functional designs...',
  },
];

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Internships', value: 'internship' },
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Remote', value: 'remote' },
];

export default function CareerPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = mockJobs.filter((job) => {
    if (activeFilter !== 'all' && job.type.toLowerCase().replace(' ', '_') !== activeFilter) {
      return false;
    }
    if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Career Hub</h1>
        <p className={styles.subtitle}>
          AI-matched opportunities for your skills
        </p>
      </header>

      {/* Search & Filters */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.filters}>
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={`${styles.filterBtn} ${
              activeFilter === filter.value ? styles.active : ''
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <div className={styles.jobsList}>
        {filteredJobs.map((job) => (
          <div key={job.id} className={styles.jobCard}>
            <div className={styles.jobMatch}>
              <span className={styles.matchBadge}>{job.match}%</span>
              <span className={styles.matchLabel}>AI Match</span>
            </div>

            <div className={styles.jobContent}>
              <div className={styles.jobHeader}>
                <div className={styles.companyInfo}>
                  <span className={styles.logo}>{job.logo}</span>
                  <div>
                    <h3 className={styles.jobTitle}>{job.title}</h3>
                    <p className={styles.company}>{job.company}</p>
                  </div>
                </div>
                <button className={styles.applyBtn}>Apply Now</button>
              </div>

              <p className={styles.description}>{job.description}</p>

              <div className={styles.skills}>
                {job.skills.map((skill) => (
                  <span key={skill} className={styles.skill}>{skill}</span>
                ))}
              </div>

              <div className={styles.meta}>
                <span>📍 {job.location}</span>
                <span>💼 {job.type}</span>
                {job.duration && <span>⏱ {job.duration}</span>}
                <span>💰 {job.salary}</span>
                <span>🕐 {job.posted}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className={styles.empty}>
          <span>🔍</span>
          <p>No jobs found matching your criteria</p>
        </div>
      )}
    </div>
  );
}

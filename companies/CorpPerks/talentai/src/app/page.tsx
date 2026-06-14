'use client';

import Link from 'next/link';
import styles from './page.module.css';

const features = [
  {
    icon: '🎯',
    title: 'Smart Matching',
    description: 'AI-powered matching based on skills, intent, and career goals.',
  },
  {
    icon: '🧠',
    title: 'Career Intelligence',
    description: 'Your complete career graph: skills, experience, potential.',
  },
  {
    icon: '🔮',
    title: 'Future Insights',
    description: 'AI skill gap analysis and career path predictions.',
  },
];

const stats = [
  { value: '10K+', label: 'Active Roles' },
  { value: '50K+', label: 'Professionals' },
  { value: '85%', label: 'Match Accuracy' },
  { value: '2.5K+', label: 'Companies' },
];

const mockJobs = [
  {
    id: '1',
    title: 'Senior React Developer',
    company: 'TechFlow',
    logo: '🌊',
    location: 'Bangalore',
    type: 'Full Time',
    salary: '₹25-40 LPA',
    match: 94,
  },
  {
    id: '2',
    title: 'Product Manager',
    company: 'InnovateCo',
    logo: '💡',
    location: 'Mumbai',
    type: 'Full Time',
    salary: '₹30-45 LPA',
    match: 89,
  },
  {
    id: '3',
    title: 'ML Engineer',
    company: 'AI Labs',
    logo: '🤖',
    location: 'Remote',
    type: 'Full Time',
    salary: '₹35-50 LPA',
    match: 91,
  },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span>🎯</span>
          <span>TalentAI</span>
        </div>
        <nav className={styles.nav}>
          <Link href="/jobs">Find Roles</Link>
          <Link href="/profile">My Profile</Link>
          <Link href="/insights">Insights</Link>
        </nav>
        <div className={styles.headerActions}>
          <Link href="/login" className={styles.loginBtn}>Login</Link>
          <Link href="/signup" className={styles.signupBtn}>Get Started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>
            Jobs That <span className={styles.highlight}>Actually Fit</span>
          </h1>
          <p>
            Not a job board. An AI career intelligence platform that matches your skills
            and potential to roles that fit you best.
          </p>
          <div className={styles.heroSearch}>
            <input
              type="text"
              placeholder="What role interests you?"
              className={styles.searchInput}
            />
            <button className={styles.searchBtn}>Find Matches</button>
          </div>
          <div className={styles.quickLinks}>
            <span>Popular:</span>
            <Link href="/jobs/react">React</Link>
            <Link href="/jobs/python">Python</Link>
            <Link href="/jobs/remote">Remote</Link>
            <Link href="/jobs/startup">Startup</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <span className={styles.statValue}>{stat.value}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className={styles.features}>
        <h2>How TalentAI Works</h2>
        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <div key={feature.title} className={styles.feature}>
              <span className={styles.featureIcon}>{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Roles */}
      <section className={styles.featured}>
        <div className={styles.sectionHeader}>
          <h2>Matched Roles</h2>
          <Link href="/jobs" className={styles.viewAll}>
            View All →
          </Link>
        </div>
        <div className={styles.roleList}>
          {mockJobs.map((job) => (
            <div key={job.id} className={styles.roleCard}>
              <div className={styles.matchScore}>
                <span className={styles.score}>{job.match}%</span>
                <span className={styles.scoreLabel}>match</span>
              </div>
              <div className={styles.roleInfo}>
                <div className={styles.companyRow}>
                  <span className={styles.companyLogo}>{job.logo}</span>
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.company}</p>
                  </div>
                </div>
                <div className={styles.roleMeta}>
                  <span>📍 {job.location}</span>
                  <span>💼 {job.type}</span>
                  <span>💰 {job.salary}</span>
                </div>
              </div>
              <button className={styles.applyBtn}>Apply</button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2>Start Your Career Intelligence</h2>
        <p>Join professionals finding better-fit roles through AI matching.</p>
        <Link href="/signup" className={styles.ctaBtn}>
          Create Free Profile →
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 TalentAI. Career intelligence platform.</p>
      </footer>
    </div>
  );
}

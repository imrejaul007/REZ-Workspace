import Link from 'next/link';
import styles from './page.module.css';

// Mock data for demo
const mockUser = {
  name: 'Rahul Sharma',
  college: 'IIT Delhi',
  year: '3rd Year',
  skills: ['React', 'Node.js', 'Python'],
};

const mockStats = {
  profileStrength: 75,
  matchedJobs: 12,
  applications: 5,
  interviews: 2,
};

const mockRecommendedJobs = [
  {
    id: '1',
    title: 'Frontend Developer Intern',
    company: 'TechCorp',
    location: 'Bangalore',
    type: 'Internship',
    match: 92,
    salary: '₹25,000/month',
  },
  {
    id: '2',
    title: 'React Developer',
    company: 'StartupXYZ',
    location: 'Remote',
    type: 'Full Time',
    match: 88,
    salary: '₹8 LPA',
  },
  {
    id: '3',
    title: 'ML Engineer Intern',
    company: 'AI Labs',
    location: 'Hyderabad',
    type: 'Internship',
    match: 85,
    salary: '₹30,000/month',
  },
];

const quickActions = [
  { icon: '📝', label: 'Build Resume', href: '/career/resume' },
  { icon: '💼', label: 'Find Jobs', href: '/career' },
  { icon: '📚', label: 'Add Skills', href: '/career/skills' },
  { icon: '🎓', label: 'Certifications', href: '/career/certifications' },
];

export default function DashboardPage() {
  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1>Welcome back, {mockUser.name} 👋</h1>
          <p className={styles.subtitle}>
            {mockUser.college} • {mockUser.year}
          </p>
        </div>
        <div className={styles.profileStrength}>
          <span className={styles.strengthLabel}>Profile Strength</span>
          <div className={styles.strengthBar}>
            <div
              className={styles.strengthFill}
              style={{ width: `${mockStats.profileStrength}%` }}
            />
          </div>
          <span className={styles.strengthValue}>{mockStats.profileStrength}%</span>
        </div>
      </header>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🎯</span>
          <div>
            <span className={styles.statValue}>{mockStats.matchedJobs}</span>
            <span className={styles.statLabel}>Matched Jobs</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📨</span>
          <div>
            <span className={styles.statValue}>{mockStats.applications}</span>
            <span className={styles.statLabel}>Applications</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📅</span>
          <div>
            <span className={styles.statValue}>{mockStats.interviews}</span>
            <span className={styles.statLabel}>Interviews</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <section className={styles.section}>
        <h2>Quick Actions</h2>
        <div className={styles.quickActions}>
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className={styles.quickAction}>
              <span className={styles.quickIcon}>{action.icon}</span>
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recommended Jobs */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>AI Recommended Jobs</h2>
          <Link href="/career" className={styles.viewAll}>
            View All →
          </Link>
        </div>
        <div className={styles.jobList}>
          {mockRecommendedJobs.map((job) => (
            <div key={job.id} className={styles.jobCard}>
              <div className={styles.jobMatch}>
                <span className={styles.matchBadge}>{job.match}%</span>
                <span className={styles.matchLabel}>match</span>
              </div>
              <div className={styles.jobInfo}>
                <h3>{job.title}</h3>
                <p className={styles.jobCompany}>{job.company}</p>
                <div className={styles.jobMeta}>
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

      {/* Skills Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Your Skills</h2>
          <Link href="/career/skills" className={styles.viewAll}>
            Add More →
          </Link>
        </div>
        <div className={styles.skills}>
          {mockUser.skills.map((skill) => (
            <span key={skill} className={styles.skillBadge}>{skill}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

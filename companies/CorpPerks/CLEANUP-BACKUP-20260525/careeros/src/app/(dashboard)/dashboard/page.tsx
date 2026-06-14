'use client';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import styles from './page.module.css';

const stats = [
  { label: 'Profile Views', value: '247', change: '+12%', positive: true },
  { label: 'Interview Score', value: '85', change: '+5', positive: true },
  { label: 'Applied Jobs', value: '23', change: '+8', positive: true },
  { label: 'Skill Match', value: '72%', change: '-3%', positive: false },
];

const recentActivity = [
  {
    type: 'interview',
    title: 'Mock Interview Completed',
    desc: 'Frontend Developer - 85% match',
    time: '2 hours ago',
    icon: '🎯',
  },
  {
    type: 'job',
    title: 'New Job Match',
    desc: 'Senior React Developer at TechCorp',
    time: '4 hours ago',
    icon: '💼',
  },
  {
    type: 'skill',
    title: 'Skill Gap Identified',
    desc: 'GraphQL recommended for your target role',
    time: 'Yesterday',
    icon: '📊',
  },
  {
    type: 'resume',
    title: 'Resume Updated',
    desc: 'ATS score improved from 72% to 89%',
    time: '2 days ago',
    icon: '📄',
  },
];

const agentCards = [
  {
    title: 'Resume Builder',
    desc: 'AI-powered resume crafting',
    icon: '📄',
    href: '/resume',
    status: 'Ready',
    color: '#6366f1',
  },
  {
    title: 'Career Path',
    desc: 'Personalized roadmap',
    icon: '🗺️',
    href: '/career-path',
    status: 'Active',
    color: '#10b981',
  },
  {
    title: 'Interview Coach',
    desc: 'Practice & feedback',
    icon: '🎯',
    href: '/interview',
    status: '3 Sessions',
    color: '#f59e0b',
  },
  {
    title: 'Job Alerts',
    desc: 'Real-time matching',
    icon: '🔔',
    href: '/alerts',
    status: '5 New',
    color: '#ef4444',
  },
  {
    title: 'Salary Negotiator',
    desc: 'Data-driven advice',
    icon: '💰',
    href: '/negotiate',
    status: 'Ready',
    color: '#8b5cf6',
  },
  {
    title: 'Skill Analyzer',
    desc: 'Gap identification',
    icon: '📊',
    href: '/skill-gap',
    status: 'Updated',
    color: '#06b6d4',
  },
  {
    title: 'Service Marketplace',
    desc: 'Hyperlocal skills',
    icon: '🌐',
    href: '/marketplace',
    status: 'Local',
    color: '#84cc16',
  },
  {
    title: 'Opportunities',
    desc: 'Student aggregator',
    icon: '🎓',
    href: '/opportunities',
    status: '12 New',
    color: '#f97316',
  },
];

const recommendedJobs = [
  {
    title: 'Senior React Developer',
    company: 'TechCorp India',
    location: 'Bangalore, Karnataka',
    salary: '₹25-35 LPA',
    match: 92,
    tags: ['React', 'TypeScript', 'Node.js'],
  },
  {
    title: 'Frontend Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    salary: '₹18-22 LPA',
    match: 87,
    tags: ['Vue.js', 'CSS', 'JavaScript'],
  },
  {
    title: 'UI Engineer',
    company: 'DesignFirst',
    location: 'Mumbai, Maharashtra',
    salary: '₹20-28 LPA',
    match: 81,
    tags: ['React', 'Figma', 'CSS'],
  },
];

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" subtitle="Your career command center" />

      <div className={styles.container}>
        <section className={styles.statsGrid}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.statCard}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statValue}>{stat.value}</span>
              <span
                className={`${styles.statChange} ${
                  stat.positive ? styles.positive : styles.negative
                }`}
              >
                {stat.change}
              </span>
            </div>
          ))}
        </section>

        <section className={styles.mainGrid}>
          <div className={styles.column}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>AI Career Agents</h2>
              <div className={styles.agentGrid}>
                {agentCards.map((agent) => (
                  <Link
                    key={agent.title}
                    href={agent.href}
                    className={styles.agentCard}
                  >
                    <div
                      className={styles.agentIcon}
                      style={{ background: `${agent.color}20`, color: agent.color }}
                    >
                      {agent.icon}
                    </div>
                    <div className={styles.agentInfo}>
                      <h3>{agent.title}</h3>
                      <p>{agent.desc}</p>
                    </div>
                    <span className={styles.agentStatus}>{agent.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Recent Activity</h2>
              <div className={styles.activityList}>
                {recentActivity.map((item, i) => (
                  <div key={i} className={styles.activityItem}>
                    <span className={styles.activityIcon}>{item.icon}</span>
                    <div className={styles.activityContent}>
                      <strong>{item.title}</strong>
                      <p>{item.desc}</p>
                      <span className={styles.activityTime}>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Recommended Jobs</h2>
              <div className={styles.jobList}>
                {recommendedJobs.map((job, i) => (
                  <div key={i} className={styles.jobCard}>
                    <div className={styles.jobHeader}>
                      <h3>{job.title}</h3>
                      <span className={styles.jobMatch}>{job.match}%</span>
                    </div>
                    <p className={styles.jobCompany}>{job.company}</p>
                    <p className={styles.jobLocation}>
                      📍 {job.location} • 💰 {job.salary}
                    </p>
                    <div className={styles.jobTags}>
                      {job.tags.map((tag) => (
                        <span key={tag} className={styles.jobTag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/alerts" className={styles.viewAll}>
                View All Jobs →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

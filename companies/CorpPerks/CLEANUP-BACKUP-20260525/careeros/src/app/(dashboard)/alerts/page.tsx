'use client';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import styles from './page.module.css';

const jobs = [
  {
    id: 1,
    title: 'Senior Frontend Developer',
    company: 'TechCorp India',
    location: 'Bangalore, Karnataka',
    salary: '₹25-35 LPA',
    type: 'Full-time',
    match: 92,
    posted: '2 hours ago',
    tags: ['React', 'TypeScript', 'System Design'],
    saved: false,
  },
  {
    id: 2,
    title: 'Frontend Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    salary: '₹18-22 LPA',
    type: 'Full-time',
    match: 87,
    posted: '5 hours ago',
    tags: ['Vue.js', 'JavaScript', 'CSS'],
    saved: true,
  },
  {
    id: 3,
    title: 'React Developer',
    company: 'GlobalTech',
    location: 'Hyderabad, Telangana',
    salary: '₹15-20 LPA',
    type: 'Contract',
    match: 78,
    posted: '1 day ago',
    tags: ['React', 'Redux', 'Testing'],
    saved: false,
  },
  {
    id: 4,
    title: 'UI Engineer',
    company: 'DesignFirst',
    location: 'Mumbai, Maharashtra',
    salary: '₹20-28 LPA',
    type: 'Full-time',
    match: 81,
    posted: '2 days ago',
    tags: ['React', 'Figma', 'CSS'],
    saved: false,
  },
  {
    id: 5,
    title: 'Lead Frontend Developer',
    company: 'EnterpriseCo',
    location: 'Pune, Maharashtra',
    salary: '₹30-40 LPA',
    type: 'Full-time',
    match: 95,
    posted: '3 days ago',
    tags: ['React', 'Leadership', 'Architecture'],
    saved: true,
  },
];

const savedSearches = [
  { name: 'React Developer Bangalore', jobs: 45, alert: true },
  { name: 'Frontend Remote', jobs: 32, alert: true },
  { name: 'Senior Dev India', jobs: 28, alert: false },
];

export default function AlertsPage() {
  const [jobList, setJobList] = useState(jobs);
  const [filter, setFilter] = useState('all');
  const [showNewAlert, setShowNewAlert] = useState(false);

  const toggleSave = (id: number) => {
    setJobList(jobs =>
      jobs.map(job =>
        job.id === id ? { ...job, saved: !job.saved } : job
      )
    );
  };

  const filteredJobs = jobList.filter(job => {
    if (filter === 'saved') return job.saved;
    if (filter === 'high-match') return job.match >= 85;
    return true;
  });

  return (
    <>
      <Header title="Job Alerts" subtitle="Real-time notifications for matching opportunities" />

      <div className={styles.container}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statNum}>127</span>
            <span className={styles.statLabel}>Jobs Found</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>8</span>
            <span className={styles.statLabel}>New Today</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>5</span>
            <span className={styles.statLabel}>Saved</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>15</span>
            <span className={styles.statLabel}>Applied</span>
          </div>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.filters}>
            <button
              className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
              onClick={() => setFilter('all')}
            >
              All Jobs
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'high-match' ? styles.active : ''}`}
              onClick={() => setFilter('high-match')}
            >
              High Match (85%+)
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'saved' ? styles.active : ''}`}
              onClick={() => setFilter('saved')}
            >
              Saved
            </button>
            <button
              className={styles.newAlertBtn}
              onClick={() => setShowNewAlert(true)}
            >
              + New Alert
            </button>
          </div>

          <div className={styles.jobList}>
            {filteredJobs.map((job) => (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.jobHeader}>
                  <div className={styles.jobMatch} style={{
                    background: job.match >= 90 ? 'var(--success)' :
                      job.match >= 80 ? 'var(--warning)' : 'var(--border)'
                  }}>
                    {job.match}%
                  </div>
                  <div className={styles.jobInfo}>
                    <h3>{job.title}</h3>
                    <p className={styles.company}>{job.company}</p>
                  </div>
                  <button
                    className={`${styles.saveBtn} ${job.saved ? styles.saved : ''}`}
                    onClick={() => toggleSave(job.id)}
                  >
                    {job.saved ? '❤️' : '🤍'}
                  </button>
                </div>

                <div className={styles.jobMeta}>
                  <span>📍 {job.location}</span>
                  <span>💰 {job.salary}</span>
                  <span>⏰ {job.posted}</span>
                  <span className={styles.jobType}>{job.type}</span>
                </div>

                <div className={styles.jobTags}>
                  {job.tags.map((tag) => (
                    <span key={tag} className={styles.jobTag}>{tag}</span>
                  ))}
                </div>

                <div className={styles.jobActions}>
                  <button className={styles.applyBtn}>Apply Now</button>
                  <button className={styles.viewBtn}>View Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h3>Saved Searches</h3>
            <div className={styles.searchList}>
              {savedSearches.map((search, i) => (
                <div key={i} className={styles.searchItem}>
                  <div className={styles.searchInfo}>
                    <strong>{search.name}</strong>
                    <span>{search.jobs} jobs</span>
                  </div>
                  <button className={`${styles.alertToggle} ${search.alert ? styles.on : ''}`}>
                    {search.alert ? '🔔' : '🔕'}
                  </button>
                </div>
              ))}
            </div>
            <button className={styles.manageBtn}>Manage Searches</button>
          </div>

          <div className={styles.section}>
            <h3>Alert Preferences</h3>
            <div className={styles.preferenceList}>
              <div className={styles.preferenceItem}>
                <span>Minimum Match Score</span>
                <select defaultValue="70">
                  <option value="50">50%</option>
                  <option value="60">60%</option>
                  <option value="70">70%</option>
                  <option value="80">80%</option>
                  <option value="90">90%</option>
                </select>
              </div>
              <div className={styles.preferenceItem}>
                <span>Alert Frequency</span>
                <select defaultValue="instant">
                  <option value="instant">Instant</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className={styles.preferenceItem}>
                <span>Job Types</span>
                <div className={styles.checkboxGroup}>
                  <label><input type="checkbox" defaultChecked /> Full-time</label>
                  <label><input type="checkbox" defaultChecked /> Contract</label>
                  <label><input type="checkbox" /> Part-time</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

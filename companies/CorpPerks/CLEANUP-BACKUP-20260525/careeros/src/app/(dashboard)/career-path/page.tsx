'use client';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import styles from './page.module.css';

const currentPath = {
  role: 'Frontend Developer',
  level: 'Mid-Level',
  yearsExp: 3,
  skills: ['React', 'TypeScript', 'Node.js', 'CSS', 'Git'],
  targetRole: 'Tech Lead',
};

const roadmap = [
  {
    phase: 1,
    title: 'Strengthen Core Skills',
    duration: '0-6 months',
    items: [
      { name: 'Advanced TypeScript Patterns', progress: 100, status: 'completed' },
      { name: 'System Design Fundamentals', progress: 75, status: 'in-progress' },
      { name: 'Performance Optimization', progress: 40, status: 'in-progress' },
      { name: 'Testing & Quality', progress: 20, status: 'pending' },
    ],
  },
  {
    phase: 2,
    title: 'Expand Leadership Skills',
    duration: '6-12 months',
    items: [
      { name: 'Team Collaboration', progress: 0, status: 'pending' },
      { name: 'Code Review Best Practices', progress: 0, status: 'pending' },
      { name: 'Mentoring Juniors', progress: 0, status: 'pending' },
      { name: 'Technical Writing', progress: 0, status: 'pending' },
    ],
  },
  {
    phase: 3,
    title: 'Transition to Tech Lead',
    duration: '12-18 months',
    items: [
      { name: 'Architecture Decisions', progress: 0, status: 'pending' },
      { name: 'Stakeholder Communication', progress: 0, status: 'pending' },
      { name: 'Project Planning', progress: 0, status: 'pending' },
      { name: 'Cross-team Leadership', progress: 0, status: 'pending' },
    ],
  },
];

const resources = [
  { title: 'System Design Interview Guide', type: 'Course', duration: '8 hours', icon: '📚' },
  { title: 'Leadership in Tech', type: 'Book', duration: '6 hours', icon: '📖' },
  { title: 'Code Review Masterclass', type: 'Video', duration: '2 hours', icon: '🎬' },
  { title: 'TypeScript Deep Dive', type: 'Course', duration: '12 hours', icon: '💻' },
];

export default function CareerPathPage() {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'resources' | 'market'>('roadmap');

  return (
    <>
      <Header title="Career Path Planner" subtitle="Your personalized roadmap to success" />

      <div className={styles.container}>
        <div className={styles.heroCard}>
          <div className={styles.heroContent}>
            <div className={styles.heroIcon}>🗺️</div>
            <div>
              <h1>Your Path from {currentPath.role} to {currentPath.targetRole}</h1>
              <p>18-month personalized roadmap based on your skills and market trends</p>
            </div>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.statNum}>18</span>
              <span className={styles.statLabel}>Months</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.statNum}>12</span>
              <span className={styles.statLabel}>Milestones</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.statNum}>45</span>
              <span className={styles.statLabel}>Skills to Learn</span>
            </div>
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'roadmap' ? styles.active : ''}`}
            onClick={() => setActiveTab('roadmap')}
          >
            Roadmap
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'resources' ? styles.active : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            Learning Resources
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'market' ? styles.active : ''}`}
            onClick={() => setActiveTab('market')}
          >
            Market Insights
          </button>
        </div>

        {activeTab === 'roadmap' && (
          <div className={styles.roadmap}>
            {roadmap.map((phase) => (
              <div key={phase.phase} className={styles.phaseCard}>
                <div className={styles.phaseHeader}>
                  <div className={styles.phaseBadge}>Phase {phase.phase}</div>
                  <h3>{phase.title}</h3>
                  <span className={styles.phaseDuration}>{phase.duration}</span>
                </div>
                <div className={styles.milestones}>
                  {phase.items.map((item, i) => (
                    <div key={i} className={styles.milestoneItem}>
                      <div className={styles.milestoneInfo}>
                        <span
                          className={`${styles.milestoneIcon} ${
                            item.status === 'completed'
                              ? styles.completed
                              : item.status === 'in-progress'
                              ? styles.inProgress
                              : ''
                          }`}
                        >
                          {item.status === 'completed' ? '✓' : item.status === 'in-progress' ? '→' : '○'}
                        </span>
                        <span className={styles.milestoneName}>{item.name}</span>
                      </div>
                      {item.status !== 'pending' && (
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {item.status === 'pending' && (
                        <button className={styles.startBtn}>Start</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className={styles.resourcesGrid}>
            {resources.map((resource, i) => (
              <div key={i} className={styles.resourceCard}>
                <span className={styles.resourceIcon}>{resource.icon}</span>
                <div className={styles.resourceInfo}>
                  <h3>{resource.title}</h3>
                  <div className={styles.resourceMeta}>
                    <span className={styles.resourceType}>{resource.type}</span>
                    <span className={styles.resourceDuration}>{resource.duration}</span>
                  </div>
                </div>
                <button className={styles.resourceBtn}>Start</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'market' && (
          <div className={styles.marketInsights}>
            <div className={styles.insightCard}>
              <h3>Demand Trends for Tech Lead</h3>
              <div className={styles.trendChart}>
                <div className={styles.trendBars}>
                  {[40, 55, 50, 65, 70, 80, 90].map((val, i) => (
                    <div key={i} className={styles.trendBar} style={{ height: `${val}%` }}>
                      <span className={styles.trendValue}>{val}%</span>
                    </div>
                  ))}
                </div>
                <div className={styles.trendLabels}>
                  <span>2020</span>
                  <span>2021</span>
                  <span>2022</span>
                  <span>2023</span>
                  <span>2024</span>
                  <span>2025</span>
                  <span>2026</span>
                </div>
              </div>
              <p className={styles.insightNote}>+125% demand growth in last 3 years</p>
            </div>

            <div className={styles.insightCard}>
              <h3>Salary Range (India)</h3>
              <div className={styles.salaryRange}>
                <span className={styles.salaryMin}>₹20 LPA</span>
                <div className={styles.salaryBar}>
                  <div className={styles.salaryFill} />
                </div>
                <span className={styles.salaryMax}>₹45 LPA</span>
              </div>
              <p className={styles.insightNote}>Average: ₹32 LPA for Tech Lead</p>
            </div>

            <div className={styles.insightCard}>
              <h3>Top Required Skills</h3>
              <div className={styles.skillsList}>
                {['System Design', 'Team Leadership', 'Communication', 'Project Management', 'Architecture'].map((skill) => (
                  <div key={skill} className={styles.skillItem}>
                    <span>{skill}</span>
                    <span className={styles.skillDemand}>High</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

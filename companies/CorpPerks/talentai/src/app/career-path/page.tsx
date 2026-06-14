'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const careerPaths = [
  {
    id: 'frontend',
    title: 'Frontend Developer',
    icon: '🎨',
    currentLevel: 3,
    levels: [
      { level: 1, title: 'Junior Developer', salary: '₹4-8 LPA', skills: ['HTML/CSS', 'JavaScript', 'React basics'] },
      { level: 2, title: 'Mid-Level Developer', salary: '₹8-15 LPA', skills: ['React/Next.js', 'TypeScript', 'CSS Frameworks'] },
      { level: 3, title: 'Senior Developer', salary: '₹15-30 LPA', skills: ['System Design', 'Performance', 'Mentoring'] },
      { level: 4, title: 'Staff Engineer', salary: '₹30-50 LPA', skills: ['Architecture', 'Technical Strategy', 'Leadership'] },
      { level: 5, title: 'Principal Engineer', salary: '₹50-80 LPA', skills: ['Platform Engineering', 'Industry Expert', 'Vision'] },
    ],
    marketTrend: '+12%',
    demand: 'High',
  },
  {
    id: 'backend',
    title: 'Backend Developer',
    icon: '⚙️',
    currentLevel: 2,
    levels: [
      { level: 1, title: 'Junior Backend', salary: '₹4-8 LPA', skills: ['Python/Node', 'SQL', 'APIs'] },
      { level: 2, title: 'Mid-Level Backend', salary: '₹10-18 LPA', skills: ['Microservices', 'Docker', 'Databases'] },
      { level: 3, title: 'Senior Backend', salary: '₹18-35 LPA', skills: ['System Design', 'Scaling', 'Security'] },
      { level: 4, title: 'Staff Engineer', salary: '₹35-55 LPA', skills: ['Platform', 'Distributed Systems', 'Leadership'] },
      { level: 5, title: 'Principal Engineer', salary: '₹55-90 LPA', skills: ['Strategy', 'Industry Standards', 'Innovation'] },
    ],
    marketTrend: '+15%',
    demand: 'Very High',
  },
  {
    id: 'fullstack',
    title: 'Full Stack Developer',
    icon: '🚀',
    currentLevel: 2,
    levels: [
      { level: 1, title: 'Junior Full Stack', salary: '₹5-10 LPA', skills: ['Frontend', 'Backend', 'Database'] },
      { level: 2, title: 'Mid-Level Full Stack', salary: '₹12-22 LPA', skills: ['React', 'Node/Python', 'Cloud'] },
      { level: 3, title: 'Senior Full Stack', salary: '₹22-40 LPA', skills: ['Architecture', 'DevOps', 'Team Lead'] },
      { level: 4, title: 'Tech Lead', salary: '₹40-60 LPA', skills: ['Technical Direction', 'Architecture', 'Management'] },
      { level: 5, title: 'Engineering Manager', salary: '₹60-100 LPA', skills: ['People Management', 'Strategy', 'Product'] },
    ],
    marketTrend: '+18%',
    demand: 'Very High',
  },
  {
    id: 'devops',
    title: 'DevOps Engineer',
    icon: '🔄',
    currentLevel: 1,
    levels: [
      { level: 1, title: 'Junior DevOps', salary: '₹5-10 LPA', skills: ['Linux', 'Docker', 'CI/CD'] },
      { level: 2, title: 'Mid-Level DevOps', salary: '₹12-22 LPA', skills: ['Kubernetes', 'AWS/GCP', 'Terraform'] },
      { level: 3, title: 'Senior DevOps', salary: '₹22-40 LPA', skills: ['Platform Engineering', 'SRE', 'Security'] },
      { level: 4, title: 'Staff DevOps', salary: '₹40-65 LPA', skills: ['Infrastructure Strategy', 'Cost Optimization', 'Leadership'] },
      { level: 5, title: 'Director of Platform', salary: '₹65-120 LPA', skills: ['Platform Vision', 'Team Building', 'Business Alignment'] },
    ],
    marketTrend: '+20%',
    demand: 'Critical',
  },
];

const skillGapAnalysis = [
  { skill: 'System Design', current: 60, required: 80, priority: 'High' },
  { skill: 'Cloud Architecture', current: 45, required: 75, priority: 'High' },
  { skill: 'TypeScript', current: 80, required: 85, priority: 'Medium' },
  { skill: 'Leadership', current: 30, required: 60, priority: 'Medium' },
  { skill: 'Performance Optimization', current: 55, required: 80, priority: 'High' },
];

const recommendedCourses = [
  { id: '1', title: 'System Design Fundamentals', platform: 'Coursera', duration: '8 weeks', match: 92 },
  { id: '2', title: 'AWS Solutions Architect', platform: 'Udemy', duration: '12 weeks', match: 88 },
  { id: '3', title: 'Technical Leadership', platform: 'LinkedIn Learning', duration: '4 weeks', match: 85 },
  { id: '4', title: 'Advanced React Patterns', platform: 'Frontend Masters', duration: '6 weeks', match: 90 },
];

export default function CareerPathPage() {
  const [selectedPath, setSelectedPath] = useState(careerPaths[0]);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'skills' | 'courses'>('roadmap');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/dashboard" className={styles.backLink}>← Back to Dashboard</Link>
          <h1>Career Path Explorer</h1>
          <p className={styles.subtitle}>Discover your ideal career trajectory and close skill gaps</p>
        </div>
      </div>

      <div className={styles.pathSelector}>
        {careerPaths.map((path) => (
          <button
            key={path.id}
            className={`${styles.pathCard} ${selectedPath.id === path.id ? styles.pathCardActive : ''}`}
            onClick={() => setSelectedPath(path)}
          >
            <span className={styles.pathIcon}>{path.icon}</span>
            <span className={styles.pathTitle}>{path.title}</span>
            <span className={`${styles.demandBadge} ${styles[`demand${path.demand.replace(' ', '')}`]}`}>
              {path.demand}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Market Growth</span>
          <span className={styles.statValue} style={{ color: '#10b981' }}>{selectedPath.marketTrend}</span>
          <span className={styles.statDesc}>Year over year</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Current Level</span>
          <span className={styles.statValue}>{selectedPath.currentLevel}/5</span>
          <span className={styles.statDesc}>{selectedPath.levels[selectedPath.currentLevel - 1].title}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Average Salary</span>
          <span className={styles.statValue}>{selectedPath.levels[selectedPath.currentLevel - 1].salary}</span>
          <span className={styles.statDesc}>At your level</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Next Level Salary</span>
          <span className={styles.statValue}>{selectedPath.levels[selectedPath.currentLevel]?.salary || 'Max'}</span>
          <span className={styles.statDesc}>Target in 2-3 years</span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'roadmap' ? styles.tabActive : ''}`} onClick={() => setActiveTab('roadmap')}>
          🛤️ Roadmap
        </button>
        <button className={`${styles.tab} ${activeTab === 'skills' ? styles.tabActive : ''}`} onClick={() => setActiveTab('skills')}>
          📊 Skill Gap Analysis
        </button>
        <button className={`${styles.tab} ${activeTab === 'courses' ? styles.tabActive : ''}`} onClick={() => setActiveTab('courses')}>
          📚 Recommended Courses
        </button>
      </div>

      {activeTab === 'roadmap' && (
        <div className={styles.roadmap}>
          <div className={styles.roadmapPath}>
            {selectedPath.levels.map((level, index) => (
              <div
                key={level.level}
                className={`${styles.levelNode} ${level.level <= selectedPath.currentLevel ? styles.levelCompleted : ''} ${level.level === selectedPath.currentLevel ? styles.levelCurrent : ''}`}
              >
                <div className={styles.levelConnector}>
                  {index > 0 && <div className={styles.connectorLine}></div>}
                </div>
                <div className={styles.levelBadge}>
                  {level.level <= selectedPath.currentLevel ? '✓' : level.level}
                </div>
                <div className={styles.levelContent}>
                  <div className={styles.levelHeader}>
                    <h3>{level.title}</h3>
                    <span className={styles.levelSalary}>{level.salary}</span>
                  </div>
                  <p className={styles.levelNumber}>Level {level.level}</p>
                  <div className={styles.levelSkills}>
                    {level.skills.map(skill => (
                      <span key={skill} className={`${styles.skillTag} ${level.level <= selectedPath.currentLevel ? styles.skillTagLearned : ''}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                  {level.level === selectedPath.currentLevel && (
                    <div className={styles.currentBadge}>You are here</div>
                  )}
                  {level.level === selectedPath.currentLevel + 1 && (
                    <div className={styles.nextBadge}>Next target</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div className={styles.skillAnalysis}>
          <div className={styles.analysisHeader}>
            <h2>Skill Gap Analysis</h2>
            <p>Based on your profile and target role requirements</p>
          </div>
          <div className={styles.gapList}>
            {skillGapAnalysis.map((skill) => (
              <div key={skill.skill} className={styles.gapCard}>
                <div className={styles.gapHeader}>
                  <span className={styles.gapSkill}>{skill.skill}</span>
                  <span className={`${styles.priorityBadge} ${styles[`priority${skill.priority}`]}`}>
                    {skill.priority} Priority
                  </span>
                </div>
                <div className={styles.gapBars}>
                  <div className={styles.gapBarRow}>
                    <span className={styles.gapLabel}>Current</span>
                    <div className={styles.gapBar}>
                      <div className={styles.gapBarFill} style={{ width: `${skill.current}%`, background: '#f59e0b' }}></div>
                    </div>
                    <span className={styles.gapPercent}>{skill.current}%</span>
                  </div>
                  <div className={styles.gapBarRow}>
                    <span className={styles.gapLabel}>Required</span>
                    <div className={styles.gapBar}>
                      <div className={styles.gapBarFill} style={{ width: `${skill.required}%`, background: '#10b981' }}></div>
                    </div>
                    <span className={styles.gapPercent}>{skill.required}%</span>
                  </div>
                </div>
                <div className={styles.gapAction}>
                  <span className={styles.gapDiff}>Gap: {skill.required - skill.current}%</span>
                  <button className={styles.gapBtn}>Start Learning →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className={styles.courses}>
          <div className={styles.coursesHeader}>
            <h2>Recommended Learning Paths</h2>
            <p>AI-curated courses to accelerate your career growth</p>
          </div>
          <div className={styles.courseGrid}>
            {recommendedCourses.map((course) => (
              <div key={course.id} className={styles.courseCard}>
                <div className={styles.courseMatch}>
                  <span className={styles.matchValue}>{course.match}%</span>
                  <span className={styles.matchLabel}>match</span>
                </div>
                <div className={styles.courseContent}>
                  <h3>{course.title}</h3>
                  <div className={styles.courseMeta}>
                    <span>📚 {course.platform}</span>
                    <span>⏱️ {course.duration}</span>
                  </div>
                  <div className={styles.courseActions}>
                    <button className={styles.enrollBtn}>Enroll Now</button>
                    <button className={styles.saveBtn}>💾 Save</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.learningPath}>
            <h3>Suggested Learning Sequence</h3>
            <div className={styles.pathSteps}>
              <div className={styles.pathStep}>
                <span className={styles.stepNumber}>1</span>
                <span className={styles.stepTitle}>Build Foundation</span>
                <span className={styles.stepDuration}>4 weeks</span>
              </div>
              <div className={styles.stepArrow}>→</div>
              <div className={styles.pathStep}>
                <span className={styles.stepNumber}>2</span>
                <span className={styles.stepTitle}>Practical Projects</span>
                <span className={styles.stepDuration}>6 weeks</span>
              </div>
              <div className={styles.stepArrow}>→</div>
              <div className={styles.pathStep}>
                <span className={styles.stepNumber}>3</span>
                <span className={styles.stepTitle}>Advanced Topics</span>
                <span className={styles.stepDuration}>4 weeks</span>
              </div>
              <div className={styles.stepArrow}>→</div>
              <div className={styles.pathStep}>
                <span className={styles.stepNumber}>4</span>
                <span className={styles.stepTitle}>Portfolio & Interview</span>
                <span className={styles.stepDuration}>2 weeks</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import styles from './page.module.css';

const currentSkills = [
  { name: 'React', level: 85, category: 'Frontend' },
  { name: 'TypeScript', level: 75, category: 'Frontend' },
  { name: 'Node.js', level: 70, category: 'Backend' },
  { name: 'CSS', level: 80, category: 'Frontend' },
  { name: 'Git', level: 75, category: 'Tools' },
  { name: 'Testing', level: 45, category: 'Quality' },
];

const targetSkills = [
  { name: 'System Design', gap: 100, priority: 'High', reason: 'Required for senior roles' },
  { name: 'GraphQL', gap: 75, priority: 'Medium', reason: 'Growing demand in the market' },
  { name: 'Performance Optimization', gap: 60, priority: 'High', reason: 'Differentiator for frontend' },
  { name: 'Leadership', gap: 80, priority: 'High', reason: 'Needed for Tech Lead path' },
  { name: 'AWS/DevOps', gap: 85, priority: 'Medium', reason: 'Full-stack capability' },
  { name: 'Testing/Debugging', gap: 55, priority: 'Medium', reason: 'Quality engineering' },
];

const learningPaths = [
  {
    skill: 'System Design',
    duration: '8 weeks',
    steps: ['Basics', 'Scalability', 'Databases', 'Caching', 'Microservices'],
    resources: 12,
    icon: '🏗️',
  },
  {
    skill: 'GraphQL',
    duration: '4 weeks',
    steps: ['Schema Design', 'Queries', 'Mutations', 'Subscriptions'],
    resources: 8,
    icon: '📊',
  },
  {
    skill: 'Leadership',
    duration: '6 weeks',
    steps: ['Communication', 'Mentoring', 'Decision Making', 'Conflict Resolution'],
    resources: 10,
    icon: '👔',
  },
];

export default function SkillGapPage() {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  return (
    <>
      <Header title="Skill Gap Analyzer" subtitle="Identify and close your skill gaps" />

      <div className={styles.container}>
        <div className={styles.heroCard}>
          <div className={styles.heroContent}>
            <h1>Your Skill Gap Analysis</h1>
            <p>Based on your target role: Senior Frontend Developer → Tech Lead</p>
          </div>
          <div className={styles.overallScore}>
            <span className={styles.scoreNum}>68%</span>
            <span className={styles.scoreLabel}>Gap Closure</span>
          </div>
        </div>

        <div className={styles.mainGrid}>
          <div className={styles.column}>
            <div className={styles.section}>
              <h2>Current Skills</h2>
              <div className={styles.skillBars}>
                {currentSkills.map((skill, i) => (
                  <div key={i} className={styles.skillRow}>
                    <div className={styles.skillInfo}>
                      <span className={styles.skillName}>{skill.name}</span>
                      <span className={styles.skillCategory}>{skill.category}</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${skill.level}%`,
                          background: skill.level >= 80 ? 'var(--success)' :
                            skill.level >= 60 ? 'var(--warning)' : 'var(--danger)'
                        }}
                      />
                    </div>
                    <span className={styles.skillLevel}>{skill.level}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h2>Skills to Acquire</h2>
              <div className={styles.gapList}>
                {targetSkills.map((skill, i) => (
                  <div
                    key={i}
                    className={`${styles.gapCard} ${selectedSkill === skill.name ? styles.selected : ''}`}
                    onClick={() => setSelectedSkill(selectedSkill === skill.name ? null : skill.name)}
                  >
                    <div className={styles.gapHeader}>
                      <h3>{skill.name}</h3>
                      <span className={`${styles.priority} ${styles[skill.priority.toLowerCase()]}`}>
                        {skill.priority}
                      </span>
                    </div>
                    <p className={styles.gapReason}>{skill.reason}</p>
                    <div className={styles.gapProgress}>
                      <span>Gap: {skill.gap}%</span>
                      <div className={styles.miniBar}>
                        <div className={styles.miniFill} style={{ width: `${100 - skill.gap}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.section}>
              <h2>Learning Paths</h2>
              <div className={styles.pathList}>
                {learningPaths.map((path, i) => (
                  <div key={i} className={styles.pathCard}>
                    <div className={styles.pathHeader}>
                      <span className={styles.pathIcon}>{path.icon}</span>
                      <div>
                        <h3>{path.skill}</h3>
                        <span className={styles.pathDuration}>{path.duration}</span>
                      </div>
                    </div>
                    <div className={styles.pathSteps}>
                      {path.steps.map((step, j) => (
                        <span key={j} className={styles.pathStep}>
                          {j + 1}. {step}
                        </span>
                      ))}
                    </div>
                    <div className={styles.pathFooter}>
                      <span>{path.resources} resources</span>
                      <button>Start Path</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h2>Quick Wins</h2>
              <div className={styles.winsList}>
                <div className={styles.winItem}>
                  <span className={styles.winIcon}>⚡</span>
                  <div>
                    <strong>Complete Testing Course</strong>
                    <span>+15% gap closure</span>
                  </div>
                </div>
                <div className={styles.winItem}>
                  <span className={styles.winIcon}>📚</span>
                  <div>
                    <strong>Read System Design Book</strong>
                    <span>+20% gap closure</span>
                  </div>
                </div>
                <div className={styles.winItem}>
                  <span className={styles.winIcon}>🎯</span>
                  <div>
                    <strong>Practice Leadership Scenarios</strong>
                    <span>+10% gap closure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

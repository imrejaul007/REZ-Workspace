'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const mockPipeline = [
  { id: '1', name: 'Priya Sharma', email: 'priya@email.com', role: 'Frontend Developer', stage: 'interview', match: 92 },
  { id: '2', name: 'Rahul Verma', email: 'rahul@email.com', role: 'Backend Engineer', stage: 'screening', match: 85 },
  { id: '3', name: 'Sneha Patel', email: 'sneha@email.com', role: 'UI/UX Designer', stage: 'applied', match: 78 },
  { id: '4', name: 'Amit Kumar', email: 'amit@email.com', role: 'Data Scientist', stage: 'offer', match: 88 },
  { id: '5', name: 'Neha Singh', email: 'neha@email.com', role: 'Product Manager', stage: 'interview', match: 75 },
];

const stages = ['applied', 'screening', 'interview', 'offer'];

export default function HiringPage() {
  const [activeStage, setActiveStage] = useState('all');

  const filteredCandidates = activeStage === 'all'
    ? mockPipeline
    : mockPipeline.filter(c => c.stage === activeStage);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Hiring</h1>
          <p>Manage your recruitment pipeline</p>
        </div>
        <Link href="/hiring/post" className={styles.postBtn}>
          + Post New Job
        </Link>
      </header>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>12</span>
          <span className={styles.statLabel}>Open Positions</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>45</span>
          <span className={styles.statLabel}>Total Candidates</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>5</span>
          <span className={styles.statLabel}>In Interview</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>2</span>
          <span className={styles.statLabel}>Offers Extended</span>
        </div>
      </div>

      {/* Pipeline */}
      <div className={styles.pipeline}>
        <h2>Pipeline</h2>
        <div className={styles.stages}>
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              className={`${styles.stageBtn} ${activeStage === stage ? styles.active : ''}`}
            >
              <span className={styles.stageName}>
                {stage.charAt(0).toUpperCase() + stage.slice(1)}
              </span>
              <span className={styles.stageCount}>
                {mockPipeline.filter(c => c.stage === stage).length}
              </span>
            </button>
          ))}
          <button
            onClick={() => setActiveStage('all')}
            className={`${styles.stageBtn} ${activeStage === 'all' ? styles.active : ''}`}
          >
            <span className={styles.stageName}>All</span>
            <span className={styles.stageCount}>{mockPipeline.length}</span>
          </button>
        </div>
      </div>

      {/* Candidates */}
      <div className={styles.candidates}>
        {filteredCandidates.map((candidate) => (
          <div key={candidate.id} className={styles.candidate}>
            <div className={styles.match}>
              <span className={styles.matchBadge}>{candidate.match}%</span>
              <span className={styles.matchLabel}>Match</span>
            </div>
            <div className={styles.candidateInfo}>
              <h3>{candidate.name}</h3>
              <p>{candidate.role}</p>
              <span className={styles.email}>{candidate.email}</span>
            </div>
            <div className={styles.candidateStage}>
              <span className={`${styles.stageTag} ${styles[candidate.stage]}`}>
                {candidate.stage}
              </span>
            </div>
            <div className={styles.actions}>
              <button className={styles.viewBtn}>View</button>
              <button className={styles.scheduleBtn}>Schedule</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

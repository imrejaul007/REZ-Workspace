'use client';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import styles from './page.module.css';

const marketData = {
  role: 'Senior Frontend Developer',
  location: 'Bangalore, Karnataka',
  experience: '5 years',
  marketRange: { min: 22, max: 38 },
  average: 28,
  yourTarget: 32,
};

const negotiationTips = [
  { title: 'Research Market Rates', desc: 'Use data-driven insights to back your ask', icon: '📊' },
  { title: 'Know Your Value', desc: 'Quantify your achievements and impact', icon: '💎' },
  { title: 'Practice Scripts', desc: 'Rehearse your negotiation conversation', icon: '🎯' },
  { title: 'Consider Total Comp', desc: 'Look beyond base salary to benefits', icon: '💰' },
];

const scripts = [
  { title: 'Initial Ask', text: '"Based on my research and the value I bring, I\'m targeting ₹35 LPA for this role."' },
  { title: 'Counter Response', text: '"I appreciate the offer. Given my experience with [relevant skill], I believe ₹32 LPA is fair."' },
  { title: 'Closing Line', text: '"I\'m excited about this opportunity. Let\'s find a number that works for both of us."' },
];

export default function NegotiatePage() {
  const [salary, setSalary] = useState(marketData.yourTarget);
  const [showScripts, setShowScripts] = useState(false);

  return (
    <>
      <Header title="Salary Negotiator" subtitle="Data-driven compensation strategy" />

      <div className={styles.container}>
        <div className={styles.heroSection}>
          <div className={styles.heroCard}>
            <div className={styles.heroContent}>
              <h1>Negotiate Your Best Package</h1>
              <p>Based on market data for {marketData.role} in {marketData.location}</p>
            </div>
          </div>
          <div className={styles.salaryCard}>
            <div className={styles.salaryRange}>
              <div className={styles.rangeBar}>
                <div className={styles.rangeTrack}>
                  <div className={styles.rangeFill} />
                  <div className={styles.rangeUser} style={{ left: `${((salary - marketData.marketRange.min) / (marketData.marketRange.max - marketData.marketRange.min)) * 100}%` }}>
                    <span className={styles.rangeUserLabel}>You</span>
                  </div>
                  <div className={styles.rangeAvg} style={{ left: `${((marketData.average - marketData.marketRange.min) / (marketData.marketRange.max - marketData.marketRange.min)) * 100}%` }}>
                    <span className={styles.rangeAvgLabel}>Avg: ₹{marketData.average}L</span>
                  </div>
                </div>
                <div className={styles.rangeLabels}>
                  <span>₹{marketData.marketRange.min}L</span>
                  <span>₹{marketData.marketRange.max}L</span>
                </div>
              </div>
              <div className={styles.salaryValue}>
                <span className={styles.currency}>₹</span>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                />
                <span className={styles.unit}>LPA</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.mainGrid}>
          <div className={styles.column}>
            <div className={styles.section}>
              <h2>Market Analysis</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statIcon}>📈</span>
                  <div className={styles.statInfo}>
                    <span className={styles.statValue}>₹{marketData.marketRange.min}-{marketData.marketRange.max}L</span>
                    <span className={styles.statLabel}>Market Range</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statIcon}>📊</span>
                  <div className={styles.statInfo}>
                    <span className={styles.statValue}>₹{marketData.average}L</span>
                    <span className={styles.statLabel}>Average</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statIcon}>🎯</span>
                  <div className={styles.statInfo}>
                    <span className={styles.statValue}>₹{salary}L</span>
                    <span className={styles.statLabel}>Your Target</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statIcon}>⚡</span>
                  <div className={styles.statInfo}>
                    <span className={styles.statValue}>{Math.round((salary / marketData.average - 1) * 100)}%</span>
                    <span className={styles.statLabel}>Above Average</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2>Negotiation Tips</h2>
              <div className={styles.tipsGrid}>
                {negotiationTips.map((tip, i) => (
                  <div key={i} className={styles.tipCard}>
                    <span className={styles.tipIcon}>{tip.icon}</span>
                    <h3>{tip.title}</h3>
                    <p>{tip.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Scripts & Phrases</h2>
                <button onClick={() => setShowScripts(!showScripts)}>
                  {showScripts ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className={`${styles.scriptsList} ${showScripts ? styles.show : ''}`}>
                {scripts.map((script, i) => (
                  <div key={i} className={styles.scriptCard}>
                    <h4>{script.title}</h4>
                    <p>{script.text}</p>
                    <button className={styles.copyBtn}>Copy</button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h2>Factors to Consider</h2>
              <div className={styles.factorsList}>
                <div className={styles.factorItem}>
                  <span className={styles.factorIcon}>💼</span>
                  <div>
                    <strong>Base Salary</strong>
                    <span>Fixed annual compensation</span>
                  </div>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorIcon}>📈</span>
                  <div>
                    <strong>Bonus</strong>
                    <span>Performance-based incentives</span>
                  </div>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorIcon}>📋</span>
                  <div>
                    <strong>Equity</strong>
                    <span>Stock options or RSUs</span>
                  </div>
                </div>
                <div className={styles.factorItem}>
                  <span className={styles.factorIcon}>🏥</span>
                  <div>
                    <strong>Benefits</strong>
                    <span>Health, wellness, PTO</span>
                  </div>
                </div>
              </div>
            </div>

            <button className={styles.negotiateBtn}>
              Start Negotiation Practice
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

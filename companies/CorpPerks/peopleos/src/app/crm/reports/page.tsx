'use client';

import { useState } from 'react';
import styles from './page.module.css';

// Mock data
const mockRevenueData = [
  { month: 'Jan', revenue: 1200000 },
  { month: 'Feb', revenue: 1450000 },
  { month: 'Mar', revenue: 1800000 },
  { month: 'Apr', revenue: 1650000 },
  { month: 'May', revenue: 2100000 },
  { month: 'Jun', revenue: 2450000 },
];

const mockConversionData = [
  { stage: 'Lead → Qualified', rate: 45 },
  { stage: 'Qualified → Proposal', rate: 60 },
  { stage: 'Proposal → Negotiation', rate: 55 },
  { stage: 'Negotiation → Won', rate: 70 },
];

const mockTopProducts = [
  { name: 'Enterprise License', revenue: 8500000, deals: 12 },
  { name: 'Cloud Migration', revenue: 5200000, deals: 8 },
  { name: 'Security Audit', revenue: 3100000, deals: 15 },
  { name: 'SaaS Implementation', revenue: 2800000, deals: 6 },
  { name: 'DevOps Services', revenue: 1900000, deals: 10 },
];

const formatCurrency = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${value.toLocaleString('en-IN')}`;
};

export default function ReportsPage() {
  const [period, setPeriod] = useState('6months');

  const maxRevenue = Math.max(...mockRevenueData.map((d) => d.revenue));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>CRM Reports</h1>
          <p className={styles.subtitle}>Analytics and insights</p>
        </div>
        <select
          className={styles.periodSelect}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </header>

      {/* Key Metrics */}
      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Revenue</span>
          <span className={styles.metricValue}>{formatCurrency(9650000)}</span>
          <span className={styles.metricChange}>+18% vs last period</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Win Rate</span>
          <span className={styles.metricValue}>68%</span>
          <span className={styles.metricChange}>+5% vs last period</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Avg Deal Size</span>
          <span className={styles.metricValue}>{formatCurrency(804167)}</span>
          <span className={styles.metricChange}>+12% vs last period</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Sales Cycle</span>
          <span className={styles.metricValue}>42 days</span>
          <span className={styles.metricChange}>-8 days vs last period</span>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Revenue Chart */}
        <div className={styles.card}>
          <h2>Revenue Trend</h2>
          <div className={styles.chart}>
            {mockRevenueData.map((data, index) => (
              <div key={data.month} className={styles.bar}>
                <div className={styles.barValue}>{formatCurrency(data.revenue)}</div>
                <div className={styles.barContainer}>
                  <div
                    className={styles.barFill}
                    style={{
                      height: `${(data.revenue / maxRevenue) * 100}%`,
                      animationDelay: `${index * 0.1}s`,
                    }}
                  />
                </div>
                <span className={styles.barLabel}>{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className={styles.card}>
          <h2>Conversion Rates</h2>
          <div className={styles.conversionFunnel}>
            {mockConversionData.map((data, index) => (
              <div key={data.stage} className={styles.conversionStep}>
                <div className={styles.conversionBar}>
                  <div
                    className={styles.conversionFill}
                    style={{ width: `${data.rate}%` }}
                  />
                </div>
                <div className={styles.conversionInfo}>
                  <span className={styles.conversionStage}>{data.stage}</span>
                  <span className={styles.conversionRate}>{data.rate}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.funnelSummary}>
            <div className={styles.funnelStat}>
              <span>Overall Conversion</span>
              <strong>12.5%</strong>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className={styles.card}>
          <h2>Top Products/Services</h2>
          <div className={styles.productList}>
            {mockTopProducts.map((product, index) => (
              <div key={product.name} className={styles.productItem}>
                <span className={styles.productRank}>{index + 1}</span>
                <div className={styles.productInfo}>
                  <span className={styles.productName}>{product.name}</span>
                  <span className={styles.productDeals}>{product.deals} deals</span>
                </div>
                <span className={styles.productRevenue}>{formatCurrency(product.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Health */}
        <div className={styles.card}>
          <h2>Pipeline Health</h2>
          <div className={styles.pipelineHealth}>
            <div className={styles.healthMetric}>
              <div className={styles.healthCircle} style={{ '--percentage': '85' } as React.CSSProperties}>
                <span className={styles.healthValue}>85%</span>
              </div>
              <span className={styles.healthLabel}>On Track</span>
            </div>
            <div className={styles.healthDetails}>
              <div className={styles.healthItem}>
                <span className={styles.healthDot} style={{ background: '#10b981' }} />
                <span>Healthy deals</span>
                <strong>12</strong>
              </div>
              <div className={styles.healthItem}>
                <span className={styles.healthDot} style={{ background: '#f59e0b' }} />
                <span>At risk</span>
                <strong>3</strong>
              </div>
              <div className={styles.healthItem}>
                <span className={styles.healthDot} style={{ background: '#ef4444' }} />
                <span>Stalled</span>
                <strong>2</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className={styles.card}>
          <h2>Team Activity</h2>
          <div className={styles.activitySummary}>
            <div className={styles.activityItem}>
              <span className={styles.activityIcon}>📞</span>
              <div>
                <span className={styles.activityValue}>156</span>
                <span className={styles.activityLabel}>Calls</span>
              </div>
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityIcon}>📧</span>
              <div>
                <span className={styles.activityValue}>89</span>
                <span className={styles.activityLabel}>Emails</span>
              </div>
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityIcon}>🤝</span>
              <div>
                <span className={styles.activityValue}>42</span>
                <span className={styles.activityLabel}>Meetings</span>
              </div>
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityIcon}>📝</span>
              <div>
                <span className={styles.activityValue}>67</span>
                <span className={styles.activityLabel}>Notes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast */}
        <div className={styles.card}>
          <h2>Revenue Forecast</h2>
          <div className={styles.forecast}>
            <div className={styles.forecastItem}>
              <span className={styles.forecastLabel}>Q2 2026 Prediction</span>
              <span className={styles.forecastValue}>{formatCurrency(12000000)}</span>
              <span className={styles.forecastConfidence}>85% confidence</span>
            </div>
            <div className={styles.forecastItem}>
              <span className={styles.forecastLabel}>Q3 2026 Projection</span>
              <span className={styles.forecastValue}>{formatCurrency(15000000)}</span>
              <span className={styles.forecastConfidence}>72% confidence</span>
            </div>
            <div className={styles.forecastItem}>
              <span className={styles.forecastLabel}>Q4 2026 Projection</span>
              <span className={styles.forecastValue}>{formatCurrency(18000000)}</span>
              <span className={styles.forecastConfidence}>65% confidence</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Mock data for demo
const mockSummary = {
  clientCount: 24,
  activeDealsCount: 18,
  openInvoicesCount: 12,
  monthlyRevenue: 2450000,
  monthlyDeals: 5,
  pipeline: {
    totalValue: 18500000,
    weightedValue: 9250000,
    valueByStage: [
      { stage: 'Lead', value: 3500000, count: 8 },
      { stage: 'Qualified', value: 5000000, count: 5 },
      { stage: 'Proposal', value: 6000000, count: 3 },
      { stage: 'Negotiation', value: 4000000, count: 2 },
    ],
  },
};

const mockRecentDeals = [
  { id: '1', title: 'Enterprise License - TechCorp', value: 2500000, stage: 'negotiation', company: 'TechCorp India' },
  { id: '2', title: 'Cloud Migration - DataSoft', value: 1800000, stage: 'proposal', company: 'DataSoft Solutions' },
  { id: '3', title: 'Security Audit - FinSecure', value: 950000, stage: 'qualified', company: 'FinSecure Ltd' },
  { id: '4', title: 'SaaS Implementation - CloudBase', value: 1200000, stage: 'lead', company: 'CloudBase Inc' },
];

const mockTopClients = [
  { id: '1', name: 'TechCorp India', industry: 'Technology', dealValue: 4500000, status: 'active' },
  { id: '2', name: 'DataSoft Solutions', industry: 'IT Services', dealValue: 3200000, status: 'active' },
  { id: '3', name: 'FinSecure Ltd', industry: 'Finance', dealValue: 2800000, status: 'prospect' },
  { id: '4', name: 'CloudBase Inc', industry: 'Cloud', dealValue: 2100000, status: 'active' },
];

const formatCurrency = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
};

export default function CRMDashboard() {
  const [summary, setSummary] = useState(mockSummary);
  const [loading, setLoading] = useState(false);

  // In production, fetch from API
  useEffect(() => {
    // const fetchData = async () => {
    //   setLoading(true);
    //   try {
    //     const data = await crmApi.analytics.getDashboard();
    //     if (data.success && data.data) {
    //       setSummary(data.data);
    //     }
    //   } catch (error) {
    //     logger.error('Failed to fetch CRM data:', error);
    //   }
    //   setLoading(false);
    // };
    // fetchData();
  }, []);

  const pipelineTotal = summary.pipeline.valueByStage.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1>Business CRM</h1>
          <p className={styles.subtitle}>Customer Relationship Management</p>
        </div>
        <div className={styles.actions}>
          <Link href="/crm/clients" className="btn btn-secondary">View Clients</Link>
          <Link href="/crm/deals" className="btn btn-primary">Manage Deals</Link>
        </div>
      </header>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>👥</span>
          <div>
            <span className={styles.statValue}>{summary.clientCount}</span>
            <span className={styles.statLabel}>Total Clients</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>💼</span>
          <div>
            <span className={styles.statValue}>{summary.activeDealsCount}</span>
            <span className={styles.statLabel}>Active Deals</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📄</span>
          <div>
            <span className={styles.statValue}>{summary.openInvoicesCount}</span>
            <span className={styles.statLabel}>Open Invoices</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>💰</span>
          <div>
            <span className={styles.statValue}>{formatCurrency(summary.monthlyRevenue)}</span>
            <span className={styles.statLabel}>Monthly Revenue</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Pipeline View */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Sales Pipeline</h2>
            <Link href="/crm/deals" className={styles.viewAll}>View All →</Link>
          </div>
          <div className={styles.pipeline}>
            {summary.pipeline.valueByStage.map((stage) => (
              <div key={stage.stage} className={styles.pipelineStage}>
                <div className={styles.pipelineHeader}>
                  <span className={styles.stageName}>{stage.stage}</span>
                  <span className={styles.stageCount}>{stage.count} deals</span>
                </div>
                <div className={styles.pipelineBar}>
                  <div
                    className={styles.pipelineFill}
                    style={{ width: `${pipelineTotal > 0 ? (stage.value / pipelineTotal) * 100 : 0}%` }}
                  />
                </div>
                <span className={styles.stageValue}>{formatCurrency(stage.value)}</span>
              </div>
            ))}
          </div>
          <div className={styles.pipelineTotal}>
            <span>Total Pipeline:</span>
            <span className={styles.totalValue}>{formatCurrency(summary.pipeline.totalValue)}</span>
          </div>
          <div className={styles.weightedTotal}>
            <span>Weighted Value:</span>
            <span className={styles.weightedValue}>{formatCurrency(summary.pipeline.weightedValue)}</span>
          </div>
        </div>

        {/* Recent Deals */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Recent Deals</h2>
            <Link href="/crm/deals" className={styles.viewAll}>View All →</Link>
          </div>
          <div className={styles.deals}>
            {mockRecentDeals.map((deal) => (
              <div key={deal.id} className={styles.deal}>
                <div className={styles.dealInfo}>
                  <span className={styles.dealTitle}>{deal.title}</span>
                  <span className={styles.dealCompany}>{deal.company}</span>
                </div>
                <div className={styles.dealMeta}>
                  <span className={styles.dealValue}>{formatCurrency(deal.value)}</span>
                  <span className={`${styles.dealStage} ${styles[deal.stage]}`}>
                    {deal.stage.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clients */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Top Clients</h2>
            <Link href="/crm/clients" className={styles.viewAll}>View All →</Link>
          </div>
          <div className={styles.clients}>
            {mockTopClients.map((client) => (
              <div key={client.id} className={styles.client}>
                <div className={styles.clientAvatar}>
                  {client.name.charAt(0)}
                </div>
                <div className={styles.clientInfo}>
                  <span className={styles.clientName}>{client.name}</span>
                  <span className={styles.clientIndustry}>{client.industry}</span>
                </div>
                <div className={styles.clientMeta}>
                  <span className={styles.clientValue}>{formatCurrency(client.dealValue)}</span>
                  <span className={`${styles.clientStatus} ${styles[client.status]}`}>
                    {client.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.card}>
          <h2>Quick Actions</h2>
          <div className={styles.quickActions}>
            <Link href="/crm/clients" className={styles.quickAction}>
              <span className={styles.quickIcon}>👤</span>
              <span>Add Client</span>
            </Link>
            <Link href="/crm/deals" className={styles.quickAction}>
              <span className={styles.quickIcon}>💼</span>
              <span>New Deal</span>
            </Link>
            <Link href="/crm/invoices" className={styles.quickAction}>
              <span className={styles.quickIcon}>📄</span>
              <span>Create Invoice</span>
            </Link>
            <Link href="/crm/reports" className={styles.quickAction}>
              <span className={styles.quickIcon}>📊</span>
              <span>View Reports</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

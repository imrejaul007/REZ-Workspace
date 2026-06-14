'use client';

import { useState } from 'react';
import styles from './page.module.css';

// Mock data
const mockDeals = [
  { id: '1', dealId: 'DEAL-00001', title: 'Enterprise License - TechCorp', value: 2500000, stage: 'negotiation', company: 'TechCorp India', probability: 75, expectedClose: '2026-06-15' },
  { id: '2', dealId: 'DEAL-00002', title: 'Cloud Migration - DataSoft', value: 1800000, stage: 'proposal', company: 'DataSoft Solutions', probability: 50, expectedClose: '2026-06-30' },
  { id: '3', dealId: 'DEAL-00003', title: 'Security Audit - FinSecure', value: 950000, stage: 'qualified', company: 'FinSecure Ltd', probability: 25, expectedClose: '2026-07-15' },
  { id: '4', dealId: 'DEAL-00004', title: 'SaaS Implementation - CloudBase', value: 1200000, stage: 'lead', company: 'CloudBase Inc', probability: 10, expectedClose: '2026-08-01' },
  { id: '5', dealId: 'DEAL-00005', title: 'Analytics Platform - RetailMax', value: 800000, stage: 'negotiation', company: 'RetailMax Corp', probability: 75, expectedClose: '2026-06-20' },
  { id: '6', dealId: 'DEAL-00006', title: 'CRM Integration - HealthFirst', value: 650000, stage: 'proposal', company: 'HealthFirst Hospitals', probability: 50, expectedClose: '2026-07-01' },
  { id: '7', dealId: 'DEAL-00007', title: 'DevOps Services - StartupX', value: 450000, stage: 'qualified', company: 'StartupX', probability: 25, expectedClose: '2026-07-10' },
  { id: '8', dealId: 'DEAL-00008', title: 'Mobile App - EduTech', value: 750000, stage: 'lead', company: 'EduTech Solutions', probability: 10, expectedClose: '2026-08-15' },
];

const stages = [
  { id: 'lead', name: 'Lead', probability: 10, color: '#94a3b8' },
  { id: 'qualified', name: 'Qualified', probability: 25, color: '#3b82f6' },
  { id: 'proposal', name: 'Proposal', probability: 50, color: '#f59e0b' },
  { id: 'negotiation', name: 'Negotiation', probability: 75, color: '#10b981' },
];

const formatCurrency = (value: number): string => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${value.toLocaleString('en-IN')}`;
};

export default function DealsPage() {
  const [deals] = useState(mockDeals);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);

  const getDealsByStage = (stage: string) => deals.filter((d) => d.stage === stage);

  const getStageStats = (stage: string) => {
    const stageDeals = getDealsByStage(stage);
    const total = stageDeals.reduce((sum, d) => sum + d.value, 0);
    return { count: stageDeals.length, total };
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDeal(dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    // In production, call API to update deal stage
    logger.info(`Moving deal ${draggedDeal} to ${stage}`);
    setDraggedDeal(null);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Deals Pipeline</h1>
          <p className={styles.subtitle}>Manage your sales pipeline</p>
        </div>
        <div className={styles.actions}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'kanban' ? styles.active : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              📋 Kanban
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              📝 List
            </button>
          </div>
          <button className="btn btn-primary">+ New Deal</button>
        </div>
      </header>

      {/* Pipeline Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Pipeline</span>
          <span className={styles.summaryValue}>
            {formatCurrency(deals.reduce((sum, d) => sum + d.value, 0))}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Weighted Value</span>
          <span className={styles.summaryValue}>
            {formatCurrency(
              deals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0)
            )}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Active Deals</span>
          <span className={styles.summaryValue}>{deals.length}</span>
        </div>
      </div>

      {/* Kanban View */}
      <div className={styles.kanban}>
        {stages.map((stage) => {
          const stats = getStageStats(stage.id);
          const stageDeals = getDealsByStage(stage.id);

          return (
            <div
              key={stage.id}
              className={styles.kanbanColumn}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className={styles.columnHeader} style={{ borderColor: stage.color }}>
                <div className={styles.columnTitle}>
                  <span className={styles.stageDot} style={{ background: stage.color }} />
                  <span>{stage.name}</span>
                  <span className={styles.stageCount}>{stats.count}</span>
                </div>
                <div className={styles.columnValue}>{formatCurrency(stats.total)}</div>
              </div>

              <div className={styles.columnCards}>
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className={styles.dealCard}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                  >
                    <div className={styles.dealHeader}>
                      <span className={styles.dealTitle}>{deal.title}</span>
                      <span className={styles.dealProbability}>{deal.probability}%</span>
                    </div>
                    <div className={styles.dealCompany}>{deal.company}</div>
                    <div className={styles.dealFooter}>
                      <span className={styles.dealValue}>{formatCurrency(deal.value)}</span>
                      <span className={styles.dealClose}>
                        📅 {new Date(deal.expectedClose).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className={styles.dealActions}>
                      <button className={styles.cardAction}>👁️</button>
                      <button className={styles.cardAction}>✏️</button>
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className={styles.emptyColumn}>
                    <p>No deals in this stage</p>
                    <button className={styles.addDealBtn}>+ Add Deal</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

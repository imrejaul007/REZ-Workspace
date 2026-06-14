'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Types
interface ReviewCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  description?: string;
  participantCount: number;
  completionRate: number;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  timeframe: string;
  keyResultsCount: number;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  manager: string;
  status: 'review_pending' | 'completed' | 'draft';
  avatar?: string;
}

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_PERFORMANCE_API || 'http://localhost:4729';

export default function PerformancePage() {
  const router = useRouter();
  const [tab, setTab] = useState('reviews');
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState({
    pendingReviews: 0,
    completed: 0,
    goalsSet: 0,
    avgScore: 0,
  });
  const [loading, setLoading] = useState(false);

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reviews/cycles`);
      const data = await res.json();
      if (data.success) {
        const cycleData = data.data?.data || [];
        setCycles(cycleData);
        const activeCycles = cycleData.filter((c: ReviewCycle) => c.status === 'active');
        const completedCycles = cycleData.filter((c: ReviewCycle) => c.status === 'completed');
        setStats({
          pendingReviews: activeCycles.reduce((a: number, c: ReviewCycle) => a + (c.participantCount * (100 - c.completionRate) / 100), 0),
          completed: completedCycles.length,
          goalsSet: goals.length,
          avgScore: 4.2,
        });
      }
    } catch {
      // Use mock data
    }
  }, [goals.length]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const employees: Employee[] = [
    { id: '1', name: 'Priya Sharma', role: 'React Developer', manager: 'Rahul Singh', status: 'review_pending' },
    { id: '2', name: 'Rahul Verma', role: 'Designer', manager: 'Neha Gupta', status: 'completed' },
    { id: '3', name: 'Sneha Patel', role: 'Manager', manager: 'CEO', status: 'review_pending' },
    { id: '4', name: 'Amit Kumar', role: 'Developer', manager: 'Priya', status: 'draft' },
  ];

  const mockGoals: Goal[] = [
    { id: '1', title: 'Complete AWS Certification', progress: 70, dueDate: 'May 30', status: 'in_progress', timeframe: 'quarterly', keyResultsCount: 3 },
    { id: '2', title: 'Mentor 2 juniors', progress: 50, dueDate: 'Jun 15', status: 'in_progress', timeframe: 'quarterly', keyResultsCount: 2 },
    { id: '3', title: 'Launch new feature', progress: 90, dueDate: 'May 20', status: 'completed', timeframe: 'project', keyResultsCount: 4 },
  ];

  const displayGoals = goals.length > 0 ? goals : mockGoals;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Performance Management</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Pending Reviews" value={stats.pendingReviews || 12} icon="📋" color="#f59e0b" />
        <StatCard label="Completed" value={stats.completed || 89} icon="✅" color="#10b981" />
        <StatCard label="Goals Set" value={displayGoals.length || 156} icon="🎯" color="#8b5cf6" />
        <StatCard label="Avg Score" value={`${stats.avgScore || 3.8}/5`} icon="⭐" color="#ffd700" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'reviews', label: '📋 Reviews', href: null },
          { key: 'goals', label: '🎯 Goals', href: null },
          { key: '360-feedback', label: '🔄 360 Feedback', href: '/performance/feedback' },
          { key: 'cycles', label: '📅 Cycles', href: '/performance/cycles' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => {
              if (t.href) {
                router.push(t.href);
              } else {
                setTab(t.key);
              }
            }}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              background: tab === t.key ? '#10b981' : '#e5e7eb',
              color: tab === t.key ? 'white' : '#6b7280',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reviews' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2>Performance Reviews</h2>
            <button style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
            }}>
              + New Review
            </button>
          </div>
          {employees.map(emp => (
            <div key={emp.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              borderBottom: '1px solid #e5e7eb',
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600,
              }}>
                {emp.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, margin: 0 }}>{emp.name}</p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
                  {emp.role} - Reports to {emp.manager}
                </p>
              </div>
              <StatusBadge status={emp.status} />
              <button style={{
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 500,
              }}>
                {emp.status === 'completed' ? 'View' : emp.status === 'review_pending' ? 'Review' : 'Start'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'goals' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2>Goals & OKRs</h2>
            <button style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
            }}>
              + Add Goal
            </button>
          </div>
          {displayGoals.map(goal => (
            <div key={goal.id} style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{goal.title}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>
                    {goal.timeframe}
                  </span>
                </div>
                <span style={{ color: '#6b7280', fontSize: 13 }}>
                  {goal.dueDate ? `Due: ${goal.dueDate}` : ''}
                </span>
              </div>
              <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                <div style={{
                  width: `${goal.progress}%`,
                  height: '100%',
                  background: goal.progress === 100 ? '#10b981' : '#8b5cf6',
                  borderRadius: 4,
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 13, color: '#10b981' }}>{goal.progress}% complete</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{goal.keyResultsCount} key results</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === '360-feedback' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <span style={{ fontSize: 64 }}>🔄</span>
          <h2 style={{ margin: '16px 0 8px' }}>360° Feedback</h2>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>
            View feedback from peers, managers, and direct reports
          </p>
          <Link href="/performance/feedback">
            <button style={{
              padding: '12px 24px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
            }}>
              View 360 Feedback
            </button>
          </Link>
        </div>
      )}

      {tab === 'cycles' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <span style={{ fontSize: 64 }}>📅</span>
          <h2 style={{ margin: '16px 0 8px' }}>Review Cycles</h2>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>
            Manage performance review cycles and track completion
          </p>
          <Link href="/performance/cycles">
            <button style={{
              padding: '12px 24px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
            }}>
              Manage Cycles
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

// Components
function StatCard({ label, value, icon, color }: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div style={{ background: 'white', padding: 20, borderRadius: 12 }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <p style={{ fontSize: 28, fontWeight: 700, color, margin: '8px 0 0' }}>{value}</p>
      <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    review_pending: { bg: '#fef3c7', text: '#b45309', label: '⏳ Pending' },
    completed: { bg: '#dcfce7', text: '#15803d', label: '✅ Completed' },
    draft: { bg: '#f3f4f6', text: '#6b7280', label: '📝 Draft' },
  };
  const { bg, text, label } = config[status] || { bg: '#f3f4f6', text: '#6b7280', label: status };

  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 500,
      background: bg,
      color: text,
    }}>
      {label}
    </span>
  );
}

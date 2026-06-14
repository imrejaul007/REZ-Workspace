import { Percent, Users, TrendingUp, AlertTriangle } from 'lucide-react';

const segmentCashback = [
  { segment: 'New Customers', rate: 20, users: 145, potential: '₹28,500', status: 'active' },
  { segment: 'Regular', rate: 8, users: 892, potential: '₹45,200', status: 'active' },
  { segment: 'VIP', rate: 3, users: 156, potential: '₹12,800', status: 'active' },
  { segment: 'At-Risk', rate: 15, users: 67, potential: '₹8,900', status: 'active' },
  { segment: 'Dormant', rate: 12, users: 234, potential: '₹18,600', status: 'review' },
];

const cashbackOptimizationTips = [
  { segment: 'At-Risk', current: 15, recommended: 18, reason: 'High churn risk, boost retention', savings: 'Potential +₹2,100/month' },
  { segment: 'VIP', current: 3, recommended: 2, reason: 'Loyal customers need less incentive', savings: 'Save ₹3,200/month' },
];

export default function Cashback() {
  return (
    <div>
      <div className="header">
        <div>
          <h2>Cashback Optimization</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Segment-based cashback rates that balance acquisition and retention
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline">
            <AlertTriangle size={18} />
            Review Needed
          </button>
          <button className="btn btn-primary">
            <Percent size={18} />
            Optimize Rates
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Total Cashback Issued</div>
          <div className="stat-value">₹42,850</div>
          <div className="stat-change negative">
            <TrendingUp size={14} />
            +8.5% vs last month
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Users</div>
          <div className="stat-value">1,205</div>
          <div className="stat-change positive">
            <Users size={14} />
            +12% new users
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Cashback Rate</div>
          <div className="stat-value">9.2%</div>
          <div className="stat-change positive">
            Optimal range
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ROI on Cashback</div>
          <div className="stat-value">3.8x</div>
          <div className="stat-change positive">
            Every ₹1 = ₹3.8 revenue
          </div>
        </div>
      </div>

      {/* Segment Configuration */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <span className="card-title">Segment Cashback Rates</span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Segment</th>
              <th>Current Rate</th>
              <th>Users</th>
              <th>Monthly Potential</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {segmentCashback.map((segment) => (
              <tr key={segment.segment}>
                <td>
                  <span style={{ fontWeight: 600 }}>{segment.segment}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '60px', height: '8px', background: 'var(--bg-dark)', borderRadius: '4px' }}>
                      <div style={{ width: `${segment.rate * 3}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{segment.rate}%</span>
                  </div>
                </td>
                <td>{segment.users}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{segment.potential}</td>
                <td>
                  <span className={`badge badge-${segment.status === 'active' ? 'success' : 'warning'}`}>
                    {segment.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-outline" style={{ padding: '0.5rem' }}>
                    Adjust
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optimization Tips */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">AI Optimization Suggestions</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {cashbackOptimizationTips.map((tip, index) => (
            <div key={index} style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{tip.segment} Segment</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{tip.reason}</div>
                </div>
                <span className="badge badge-success">{tip.savings}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{tip.current}%</div>
                </div>
                <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>→</div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Recommended</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{tip.recommended}%</div>
                </div>
                <button className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                  Apply Change
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

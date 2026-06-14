import { useState, useEffect } from 'react';
import { REZMemoryClient } from '@rez/memory-client';

interface Props {
  userId: string;
  client: REZMemoryClient;
}

interface Stats {
  totalMemories: number;
  byType: Record<string, number>;
  byTag: Record<string, number>;
  avgContentLength: number;
}

export default function StatsPanel({ userId, client }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.getStats(userId)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [userId, client]);

  if (loading) {
    return (
      <div className="sidebar-section">
        <h3>Statistics</h3>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="sidebar-section">
      <h3>Statistics</h3>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-value">{stats.totalMemories}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.round(stats.avgContentLength)}</div>
          <div className="stat-label">Avg Length</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Object.keys(stats.byTag).length}</div>
          <div className="stat-label">Tags</div>
        </div>
      </div>
      {Object.keys(stats.byType).length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>By Type</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {Object.entries(stats.byType).map(([type, count]) => (
              <span key={type} className="tag">
                {type}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

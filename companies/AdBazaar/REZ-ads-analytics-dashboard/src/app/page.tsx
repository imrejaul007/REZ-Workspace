'use client';

import { useState, useEffect } from 'react';

// Types
interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
}

interface DashboardStats {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  avgCtr: number;
  avgCpc: number;
  activeCampaigns: number;
}

// Mock data
const mockStats: DashboardStats = {
  totalImpressions: 2456789,
  totalClicks: 45678,
  totalConversions: 2345,
  totalSpend: 125000,
  avgCtr: 1.86,
  avgCpc: 2.74,
  activeCampaigns: 12
};

const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Summer Sale 2026', status: 'active', budget: 50000, spent: 32000, impressions: 890000, clicks: 15600, conversions: 890, ctr: 1.75, cpc: 2.05, cpa: 35.95 },
  { id: '2', name: 'New Product Launch', status: 'active', budget: 30000, spent: 18000, impressions: 520000, clicks: 9800, conversions: 456, ctr: 1.88, cpc: 1.84, cpa: 39.47 },
  { id: '3', name: 'Brand Awareness', status: 'paused', budget: 25000, spent: 15000, impressions: 670000, clicks: 8900, conversions: 234, ctr: 1.33, cpc: 1.69, cpa: 64.10 },
  { id: '4', name: 'Festival Campaign', status: 'active', budget: 75000, spent: 45000, impressions: 1200000, clicks: 24000, conversions: 1200, ctr: 2.00, cpc: 1.88, cpa: 37.50 },
  { id: '5', name: 'Retargeting Q1', status: 'completed', budget: 20000, spent: 19800, impressions: 340000, clicks: 6800, conversions: 345, ctr: 2.00, cpc: 2.91, cpa: 57.39 }
];

// Format number
function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatCurrency(n: number): string {
  return '₹' + formatNumber(n);
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: '#1a1a2e', color: 'white', padding: 20 }}>
        <h1 style={{ fontSize: 22, marginBottom: 30 }}>
          <span style={{ color: '#e94560' }}>Ad</span>Bazaar
        </h1>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <NavButton active>📊 Analytics</NavButton>
          <NavButton>🎯 Campaigns</NavButton>
          <NavButton>👥 Audiences</NavButton>
          <NavButton>💰 Billing</NavButton>
          <NavButton>⚙️ Settings</NavButton>
        </nav>

        <div style={{ marginTop: 40, padding: 16, background: '#2a2a4e', borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>QUICK STATS</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4ade80' }}>₹{(stats.totalSpend / 1000).toFixed(0)}K</div>
          <div style={{ fontSize: 12, color: '#888' }}>Total Spend</div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 24 }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0 }}>Campaign Analytics</h2>
            <p style={{ margin: '8px 0 0', color: '#666' }}>
              Track your ad performance across all channels
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: timeRange === range ? '#e94560' : '#eee',
                  color: timeRange === range ? 'white' : '#333',
                  cursor: 'pointer'
                }}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </header>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard
            title="Impressions"
            value={formatNumber(stats.totalImpressions)}
            icon="👁️"
            change="+12.5%"
            positive
          />
          <StatCard
            title="Clicks"
            value={formatNumber(stats.totalClicks)}
            icon="🖱️"
            change="+8.3%"
            positive
          />
          <StatCard
            title="Conversions"
            value={formatNumber(stats.totalConversions)}
            icon="✅"
            change="+15.2%"
            positive
          />
          <StatCard
            title="Total Spend"
            value={formatCurrency(stats.totalSpend)}
            icon="💰"
            change="+5.7%"
            positive
          />
        </div>

        {/* Performance Table */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Campaign Performance</h3>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: 12, color: '#888' }}>Campaign</th>
                <th style={{ textAlign: 'center', padding: 12, color: '#888' }}>Status</th>
                <th style={{ textAlign: 'right', padding: 12, color: '#888' }}>Impressions</th>
                <th style={{ textAlign: 'right', padding: 12, color: '#888' }}>Clicks</th>
                <th style={{ textAlign: 'right', padding: 12, color: '#888' }}>CTR</th>
                <th style={{ textAlign: 'right', padding: 12, color: '#888' }}>Conversions</th>
                <th style={{ textAlign: 'right', padding: 12, color: '#888' }}>Spend</th>
                <th style={{ textAlign: 'right', padding: 12, color: '#888' }}>CPA</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(campaign => (
                <tr
                  key={campaign.id}
                  onClick={() => setSelectedCampaign(campaign)}
                  style={{
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    background: selectedCampaign?.id === campaign.id ? '#f5f5f5' : 'transparent'
                  }}
                >
                  <td style={{ padding: 16 }}>
                    <div style={{ fontWeight: 500 }}>{campaign.name}</div>
                  </td>
                  <td style={{ padding: 16, textAlign: 'center' }}>
                    <StatusBadge status={campaign.status} />
                  </td>
                  <td style={{ padding: 16, textAlign: 'right' }}>{formatNumber(campaign.impressions)}</td>
                  <td style={{ padding: 16, textAlign: 'right' }}>{formatNumber(campaign.clicks)}</td>
                  <td style={{ padding: 16, textAlign: 'right' }}>{campaign.ctr.toFixed(2)}%</td>
                  <td style={{ padding: 16, textAlign: 'right' }}>{campaign.conversions}</td>
                  <td style={{ padding: 16, textAlign: 'right' }}>{formatCurrency(campaign.spent)}</td>
                  <td style={{ padding: 16, textAlign: 'right', fontWeight: 'bold' }}>₹{campaign.cpa.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Campaign Detail */}
        {selectedCampaign && (
          <div style={{
            marginTop: 24,
            background: 'white',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{selectedCampaign.name}</h3>
              <button
                onClick={() => setSelectedCampaign(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginTop: 20 }}>
              <DetailCard label="Budget" value={formatCurrency(selectedCampaign.budget)} />
              <DetailCard label="Spent" value={formatCurrency(selectedCampaign.spent)} />
              <DetailCard label="Impressions" value={formatNumber(selectedCampaign.impressions)} />
              <DetailCard label="CTR" value={selectedCampaign.ctr.toFixed(2) + '%'} />
              <DetailCard label="CPA" value={'₹' + selectedCampaign.cpa.toFixed(0)} />
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              <button style={styles.primaryButton}>📊 View Details</button>
              <button style={styles.secondaryButton}>📋 Download Report</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NavButton({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button style={{
      padding: '12px 15px',
      borderRadius: 8,
      border: 'none',
      background: active ? '#e94560' : 'transparent',
      color: 'white',
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: 14
    }}>
      {children}
    </button>
  );
}

function StatCard({ title, value, icon, change, positive }: {
  title: string;
  value: string;
  icon: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div style={{
      padding: 20,
      background: 'white',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <span style={{
          fontSize: 12,
          padding: '4px 8px',
          borderRadius: 12,
          background: positive ? '#dcfce7' : '#fee2e2',
          color: positive ? '#16a34a' : '#dc2626'
        }}>
          {change}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{value}</div>
      <div style={{ fontSize: 14, color: '#888' }}>{title}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: { bg: '#dcfce7', text: '#16a34a' },
    paused: { bg: '#fef3c7', text: '#d97706' },
    completed: { bg: '#e0e7ff', text: '#4f46e5' }
  };
  const color = colors[status] || colors.completed;

  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: 12,
      background: color.bg,
      color: color.text,
      fontSize: 12,
      fontWeight: 500
    }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  primaryButton: {
    padding: '10px 20px',
    background: '#e94560',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 500
  },
  secondaryButton: {
    padding: '10px 20px',
    background: '#eee',
    color: '#333',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer'
  }
};

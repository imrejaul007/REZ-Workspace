'use client';

/**
 * REZ Atlas Dashboard - Main Page
 */

import { useState, useEffect } from 'react';

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_ATLAS_GATEWAY || 'http://localhost:5150';

interface DashboardData {
  totalMerchants: number;
  territories: { count: number; list: any[] };
  leads: { count: number; list: any[] };
  opportunities: { count: number; list: any[] };
  stats: any;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('acquisition');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      // Fetch all services in parallel
      const [healthRes, leadsRes, territoriesRes, opportunitiesRes] = await Promise.all([
        fetch(`${API_BASE}/health`).catch(() => null),
        fetch(`${API_BASE}/api/score/leads?limit=20`).catch(() => ({ json: () => ({ leads: [], count: 0 }) })),
        fetch(`${API_BASE}/api/territory/territories?limit=20`).catch(() => ({ json: () => ({ territories: [], count: 0 }) })),
        fetch(`${API_BASE}/api/signals/opportunities?limit=20`).catch(() => ({ json: () => ({ opportunities: [], count: 0 }) }))
      ]);

      const health = await healthRes?.json() || {};
      const leadsData = leadsRes instanceof Response ? await leadsRes.json() : { leads: [], count: 0 };
      const territoriesData = territoriesRes instanceof Response ? await territoriesRes.json() : { territories: [], count: 0 };
      const opportunitiesData = opportunitiesRes instanceof Response ? await opportunitiesRes.json() : { opportunities: [], count: 0 };

      setData({
        totalMerchants: 150 + (leadsData.count || 0),
        territories: { count: territoriesData.count || 0, list: territoriesData.territories || [] },
        leads: { count: leadsData.count || 0, list: leadsData.leads || [] },
        opportunities: { count: opportunitiesData.count || 0, list: opportunitiesData.opportunities || [] },
        stats: health
      });
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl">Loading REZ Atlas...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">🗺️ REZ Atlas</h1>
            <p className="text-sm text-gray-400">The Merchant Intelligence Network for the Physical World</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Enterprise Dashboard</p>
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex space-x-1">
          {['acquisition', 'territory', 'opportunities', 'health'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Merchants"
            value={data?.totalMerchants || 0}
            change="+12%"
            icon="🏪"
          />
          <MetricCard
            title="Territories"
            value={data?.territories?.count || 0}
            change="+3"
            icon="🗺️"
          />
          <MetricCard
            title="Active Leads"
            value={data?.leads?.count || 0}
            change="+24%"
            icon="📈"
          />
          <MetricCard
            title="Opportunities"
            value={data?.opportunities?.count || 0}
            change="₹45L"
            icon="💰"
          />
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 capitalize">{activeTab} Dashboard</h2>

          {activeTab === 'acquisition' && (
            <AcquisitionView data={data} />
          )}
          {activeTab === 'territory' && (
            <TerritoryView data={data} />
          )}
          {activeTab === 'opportunities' && (
            <OpportunitiesView data={data} />
          )}
          {activeTab === 'health' && (
            <HealthView data={data} />
          )}
        </div>
      </main>
    </div>
  );
}

function MetricCard({ title, value, change, icon }: { title: string; value: number; change: string; icon: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className="text-green-400 text-sm">{change}</span>
      </div>
      <h3 className="text-gray-400 text-sm">{title}</h3>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}

function AcquisitionView({ data }: { data: DashboardData | null }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Conversion Funnel</h3>
          <div className="space-y-3">
            <FunnelStep label="Discovered" value={1000} percent={100} color="blue" />
            <FunnelStep label="Contacted" value={600} percent={60} color="indigo" />
            <FunnelStep label="Qualified" value={300} percent={30} color="purple" />
            <FunnelStep label="Proposal" value={150} percent={15} color="pink" />
            <FunnelStep label="Converted" value={75} percent={7.5} color="green" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-4">Monthly Trend</h3>
          <div className="h-48 flex items-end justify-between space-x-2">
            {[45, 52, 48, 61, 55, 70].map((value, i) => (
              <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${value}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FunnelStep({ label, value, percent, color }: { label: string; value: number; percent: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    green: 'bg-green-500'
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value} ({percent}%)</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full">
        <div className={`h-2 ${colors[color]} rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function TerritoryView({ data }: { data: DashboardData | null }) {
  return (
    <div>
      <p className="text-gray-400">Territory management and coverage analytics will appear here.</p>
    </div>
  );
}

function OpportunitiesView({ data }: { data: DashboardData | null }) {
  const opportunities = data?.opportunities?.list || [];
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Detected Opportunities</h3>
      {opportunities.length === 0 ? (
        <p className="text-gray-400">No opportunities detected yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {opportunities.slice(0, 6).map((opp: any) => (
            <div key={opp.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  opp.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                  opp.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {opp.severity.toUpperCase()}
                </span>
                <span className="text-green-400 font-bold">₹{(opp.potentialRevenue / 1000).toFixed(0)}K</span>
              </div>
              <h4 className="font-medium mb-1">{opp.title}</h4>
              <p className="text-sm text-gray-400 mb-2">{opp.description}</p>
              <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                {opp.suggestedProduct}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HealthView({ data }: { data: DashboardData | null }) {
  return (
    <div>
      <p className="text-gray-400">Merchant health monitoring will appear here.</p>
    </div>
  );
}
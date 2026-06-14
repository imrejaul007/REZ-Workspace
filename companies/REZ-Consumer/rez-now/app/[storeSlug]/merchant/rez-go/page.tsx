'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Types
interface LiveSession {
  sessionId: string;
  userId: string;
  userName?: string;
  items: number;
  subtotal: number;
  startedAt: string;
  fraudScore: number;
  status: 'active' | 'syncing';
}

interface GoAnalytics {
  totalSessions: number;
  totalRevenue: number;
  avgCartValue: number;
  todaySessions: number;
  todayRevenue: number;
  avgCashback: number;
  fraudRate: number;
}

interface FraudAlert {
  sessionId: string;
  score: number;
  reason: string;
  timestamp: string;
}

interface ExitVerification {
  sessionId: string;
  status: 'pending' | 'verified' | 'rejected';
  timestamp: string;
}

// Mock data for development
const mockLiveSessions: LiveSession[] = [
  { sessionId: 'GOS-abc123', userId: 'user1', userName: 'Rahul S.', items: 5, subtotal: 450, startedAt: new Date().toISOString(), fraudScore: 15, status: 'active' },
  { sessionId: 'GOS-def456', userId: 'user2', userName: 'Priya M.', items: 12, subtotal: 1250, startedAt: new Date(Date.now() - 600000).toISOString(), fraudScore: 45, status: 'active' },
  { sessionId: 'GOS-ghi789', userId: 'user3', userName: 'Amit K.', items: 3, subtotal: 180, startedAt: new Date(Date.now() - 300000).toISOString(), fraudScore: 8, status: 'active' },
];

const mockAnalytics: GoAnalytics = {
  totalSessions: 1247,
  totalRevenue: 184320,
  avgCartValue: 148,
  todaySessions: 45,
  todayRevenue: 6720,
  avgCashback: 3.5,
  fraudRate: 2.1,
};

const mockFraudAlerts: FraudAlert[] = [
  { sessionId: 'GOS-xyz999', score: 78, reason: 'High cart value + fast scanning', timestamp: new Date(Date.now() - 120000).toISOString() },
];

export default function REZGoMerchantDashboard() {
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>(mockLiveSessions);
  const [analytics, setAnalytics] = useState<GoAnalytics>(mockAnalytics);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>(mockFraudAlerts);
  const [activeTab, setActiveTab] = useState<'live' | 'analytics' | 'alerts'>('live');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // In production, fetch new data here
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setLastRefresh(new Date());
    setTimeout(() => setLoading(false), 500);
  }, []);

  // Verify exit (for staff)
  const handleExitVerify = useCallback(async (sessionId: string, action: 'approve' | 'reject') => {
    setLiveSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    // In production, call API
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">REZ Go Dashboard</h1>
            <p className="text-sm text-gray-500">
              Smart Shopping Management • Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'live'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Live Shoppers ({liveSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              activeTab === 'alerts'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Alerts
            {fraudAlerts.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {fraudAlerts.length}
              </span>
            )}
          </button>
        </div>

        {/* Live Shoppers Tab */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500">Active Sessions</div>
                <div className="text-2xl font-bold text-emerald-600">{liveSessions.length}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500">Items Scanned</div>
                <div className="text-2xl font-bold text-blue-600">
                  {liveSessions.reduce((sum, s) => sum + s.items, 0)}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500">Live Revenue</div>
                <div className="text-2xl font-bold text-purple-600">
                  ₹{liveSessions.reduce((sum, s) => sum + s.subtotal, 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500">Avg Session</div>
                <div className="text-2xl font-bold text-gray-600">
                  {liveSessions.length > 0
                    ? `₹${Math.round(liveSessions.reduce((sum, s) => sum + s.subtotal, 0) / liveSessions.length)}`
                    : '₹0'}
                </div>
              </div>
            </div>

            {/* Session List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Active Shopping Sessions</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {liveSessions.map((session) => (
                  <div key={session.sessionId} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">
                            {session.userName || session.userId.slice(0, 8)}
                          </span>
                          <span className="text-xs text-gray-400">{session.sessionId}</span>
                          {session.status === 'syncing' && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                              Syncing
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {session.items} items • Started {new Date(session.startedAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">₹{session.subtotal.toLocaleString()}</div>
                          <div className={`text-xs ${
                            session.fraudScore >= 75 ? 'text-red-600' :
                            session.fraudScore >= 50 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            Risk: {session.fraudScore}%
                          </div>
                        </div>
                        {session.fraudScore >= 50 && (
                          <button
                            onClick={() => handleExitVerify(session.sessionId, 'verify')}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {liveSessions.length === 0 && (
                  <div className="px-6 py-12 text-center text-gray-500">
                    <div className="text-4xl mb-2">🛒</div>
                    <div>No active shopping sessions</div>
                    <div className="text-sm mt-1">Live sessions will appear here</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Total Sessions</div>
                <div className="text-3xl font-bold text-gray-900">{analytics.totalSessions.toLocaleString()}</div>
                <div className="text-sm text-emerald-600 mt-1">+12% vs last week</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
                <div className="text-3xl font-bold text-gray-900">₹{analytics.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-emerald-600 mt-1">+18% vs last week</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Avg Cart Value</div>
                <div className="text-3xl font-bold text-gray-900">₹{analytics.avgCartValue}</div>
                <div className="text-sm text-gray-500 mt-1">Per transaction</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Avg Cashback</div>
                <div className="text-3xl font-bold text-emerald-600">{analytics.avgCashback}%</div>
                <div className="text-sm text-gray-500 mt-1">Per transaction</div>
              </div>
            </div>

            {/* Today's Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Performance</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{analytics.todaySessions}</div>
                  <div className="text-sm text-gray-500">Sessions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">₹{analytics.todayRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Revenue</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">₹{Math.round(analytics.todayRevenue / analytics.todaySessions)}</div>
                  <div className="text-sm text-gray-500">Avg Order Value</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{analytics.fraudRate}%</div>
                  <div className="text-sm text-gray-500">Fraud Rate</div>
                </div>
              </div>
            </div>

            {/* Peak Hours Chart (Placeholder) */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours</h2>
              <div className="h-48 bg-gray-50 rounded-lg flex items-end justify-around px-4">
                {[12, 18, 25, 32, 28, 45, 52, 48, 35, 22, 15, 8].map((val, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div
                      className="w-8 bg-emerald-500 rounded-t"
                      style={{ height: `${val * 2}px` }}
                    />
                    <span className="text-xs text-gray-500">{`${6 + i}:00`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {fraudAlerts.length > 0 ? (
              fraudAlerts.map((alert) => (
                <div
                  key={alert.sessionId}
                  className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-red-500"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                          Fraud Alert
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-2 font-medium text-gray-900">{alert.sessionId}</div>
                      <div className="mt-1 text-sm text-gray-600">{alert.reason}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-2xl font-bold text-red-600">{alert.score}%</span>
                        <span className="text-sm text-gray-500">risk score</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExitVerify(alert.sessionId, 'approve')}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleExitVerify(alert.sessionId, 'reject')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-lg font-medium text-gray-900">No Fraud Alerts</div>
                <div className="text-sm text-gray-500 mt-1">All sessions look normal</div>
              </div>
            )}

            {/* Exit Verification Queue */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Exit Verification Queue</h2>
              </div>
              <div className="p-6 text-center text-gray-500">
                No pending verifications
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

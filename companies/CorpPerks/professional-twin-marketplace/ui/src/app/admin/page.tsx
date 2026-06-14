'use client';

import { useState, useEffect } from 'react';
import { Users, Brain, Building, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign, Activity, Shield, Database, Zap, BarChart3 } from 'lucide-react';

interface PlatformStats {
  totalTwins: number;
  activeTwins: number;
  totalUsers: number;
  activeCompanies: number;
  totalRevenue: number;
  monthlyGrowth: number;
  pendingRequests: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface RecentActivity {
  id: string;
  type: string;
  user: string;
  action: string;
  timestamp: string;
}

interface TopTwin {
  twinId: string;
  owner: string;
  type: string;
  productivity: number;
  score: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats>({
    totalTwins: 0,
    activeTwins: 0,
    totalUsers: 0,
    activeCompanies: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    pendingRequests: 0,
    systemHealth: 'healthy'
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [topTwins, setTopTwins] = useState<TopTwin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load admin data (simulated)
    setTimeout(() => {
      setStats({
        totalTwins: 12847,
        activeTwins: 10892,
        totalUsers: 4521,
        activeCompanies: 187,
        totalRevenue: 2845000,
        monthlyGrowth: 23.5,
        pendingRequests: 34,
        systemHealth: 'healthy'
      });

      setActivities([
        { id: '1', type: 'hire', user: 'TechCorp Inc', action: 'Hired Rahul Sharma + 3 twins', timestamp: '2 min ago' },
        { id: '2', type: 'signup', user: 'Priya Patel', action: 'Created 5 professional twins', timestamp: '5 min ago' },
        { id: '3', type: 'milestone', user: 'Amit Kumar', action: 'Execution Twin reached Expert level', timestamp: '12 min ago' },
        { id: '4', type: 'subscription', user: 'StartupXYZ', action: 'Upgraded to Enterprise plan', timestamp: '18 min ago' },
        { id: '5', type: 'export', user: 'Sneha Reddy', action: 'Exported twin data for job change', timestamp: '25 min ago' }
      ]);

      setTopTwins([
        { twinId: 'TWIN-001', owner: 'Rahul S.', type: 'Execution', productivity: 4.8, score: 98 },
        { twinId: 'TWIN-002', owner: 'Priya P.', type: 'Skill', productivity: 4.2, score: 96 },
        { twinId: 'TWIN-003', owner: 'Amit K.', type: 'Knowledge', productivity: 3.9, score: 94 },
        { twinId: 'TWIN-004', owner: 'Sneha R.', type: 'Productivity', productivity: 3.7, score: 93 },
        { twinId: 'TWIN-005', owner: 'Vikram S.', type: 'Career', productivity: 3.5, score: 91 }
      ]);

      setLoading(false);
    }, 500);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statCards = [
    { label: 'Total Twins', value: stats.totalTwins.toLocaleString(), icon: Brain, color: 'from-purple-500 to-pink-500', trend: '+12%' },
    { label: 'Active Twins', value: stats.activeTwins.toLocaleString(), icon: Activity, color: 'from-green-500 to-emerald-500', trend: '+8%' },
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'from-blue-500 to-cyan-500', trend: '+15%' },
    { label: 'Companies', value: stats.activeCompanies.toString(), icon: Building, color: 'from-orange-500 to-amber-500', trend: '+22%' }
  ];

  const metricCards = [
    { label: 'Monthly Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'from-green-500 to-emerald-500' },
    { label: 'Growth Rate', value: `${stats.monthlyGrowth}%`, icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
    { label: 'Pending Requests', value: stats.pendingRequests.toString(), icon: Clock, color: 'from-yellow-500 to-orange-500' },
    { label: 'System Health', value: stats.systemHealth.toUpperCase(), icon: Shield, color: stats.systemHealth === 'healthy' ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">TwinOS Admin</h1>
            <p className="text-slate-400 text-sm">Platform Management Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
              Export Reports
            </button>
            <div className="flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                A
              </div>
              <span className="text-white text-sm">Admin</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="text-white" size={20} />
                </div>
                <span className="text-green-400 text-sm font-medium">{stat.trend}</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-slate-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {metricCards.map((metric, i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                  <metric.icon className="text-white" size={20} />
                </div>
                <span className="text-slate-400 text-sm">{metric.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Twins */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Top Performing Twins</h2>
              <BarChart3 className="text-slate-400" size={20} />
            </div>
            <div className="space-y-4">
              {topTwins.map((twin, i) => (
                <div key={twin.twinId} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 font-medium">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-white font-medium">{twin.owner}</div>
                      <div className="text-slate-400 text-sm">{twin.type} Twin</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{twin.productivity}x</div>
                    <div className="text-slate-400 text-sm">Score: {twin.score}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <Activity className="text-slate-400" size={20} />
            </div>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'hire' ? 'bg-green-500/20 text-green-400' :
                    activity.type === 'signup' ? 'bg-blue-500/20 text-blue-400' :
                    activity.type === 'milestone' ? 'bg-purple-500/20 text-purple-400' :
                    activity.type === 'subscription' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {activity.type === 'hire' ? <CheckCircle size={14} /> :
                     activity.type === 'signup' ? <Users size={14} /> :
                     activity.type === 'milestone' ? <Zap size={14} /> :
                     activity.type === 'subscription' ? <DollarSign size={14} /> :
                     <Database size={14} />}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm">{activity.user}</div>
                    <div className="text-slate-400 text-xs">{activity.action}</div>
                  </div>
                  <span className="text-slate-500 text-xs">{activity.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">System Status</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm">All Systems Operational</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'API Server', status: 'Operational', latency: '45ms' },
              { name: 'Database', status: 'Operational', latency: '12ms' },
              { name: 'WebSocket', status: 'Operational', latency: '8ms' },
              { name: 'Memory Bridge', status: 'Operational', latency: '23ms' }
            ].map((service, i) => (
              <div key={i} className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">{service.name}</span>
                  <span className="text-green-400 text-xs">{service.status}</span>
                </div>
                <div className="text-slate-400 text-xs">Latency: {service.latency}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-slate-900/50 hover:bg-slate-700 rounded-lg text-center transition-colors">
              <Users className="mx-auto mb-2 text-slate-400" size={24} />
              <span className="text-white text-sm">Manage Users</span>
            </button>
            <button className="p-4 bg-slate-900/50 hover:bg-slate-700 rounded-lg text-center transition-colors">
              <Brain className="mx-auto mb-2 text-slate-400" size={24} />
              <span className="text-white text-sm">Manage Twins</span>
            </button>
            <button className="p-4 bg-slate-900/50 hover:bg-slate-700 rounded-lg text-center transition-colors">
              <DollarSign className="mx-auto mb-2 text-slate-400" size={24} />
              <span className="text-white text-sm">Revenue</span>
            </button>
            <button className="p-4 bg-slate-900/50 hover:bg-slate-700 rounded-lg text-center transition-colors">
              <AlertCircle className="mx-auto mb-2 text-slate-400" size={24} />
              <span className="text-white text-sm">Support</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

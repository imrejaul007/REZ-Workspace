'use client';

import { Activity, Database, Server, Zap, Clock, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import ServiceCard from '@/components/ServiceCard';
import StatusBadge from '@/components/StatusBadge';

// Mock data for response time chart
const responseTimeData = [
  { time: '00:00', api: 45, database: 12, cache: 2, queue: 8 },
  { time: '04:00', api: 42, database: 10, cache: 1, queue: 6 },
  { time: '08:00', api: 65, database: 18, cache: 3, queue: 15 },
  { time: '12:00', api: 85, database: 25, cache: 4, queue: 22 },
  { time: '16:00', api: 78, database: 20, cache: 3, queue: 18 },
  { time: '20:00', api: 55, database: 14, cache: 2, queue: 10 },
  { time: 'Now', api: 48, database: 11, cache: 2, queue: 7 },
];

// Mock data for uptime chart
const uptimeData = [
  { day: 'Mon', uptime: 99.9 },
  { day: 'Tue', uptime: 99.8 },
  { day: 'Wed', uptime: 99.95 },
  { day: 'Thu', uptime: 99.7 },
  { day: 'Fri', uptime: 99.99 },
  { day: 'Sat', uptime: 100 },
  { day: 'Sun', uptime: 100 },
];

// Services data
const services = [
  {
    name: 'API Gateway',
    status: 'healthy' as const,
    uptime: 99.98,
    responseTime: 48,
    lastChecked: new Date().toLocaleTimeString(),
    icon: Server,
    description: 'Main API routing service',
  },
  {
    name: 'Database',
    status: 'healthy' as const,
    uptime: 99.99,
    responseTime: 11,
    lastChecked: new Date().toLocaleTimeString(),
    icon: Database,
    description: 'PostgreSQL primary cluster',
  },
  {
    name: 'Cache',
    status: 'healthy' as const,
    uptime: 99.95,
    responseTime: 2,
    lastChecked: new Date().toLocaleTimeString(),
    icon: Zap,
    description: 'Redis cache cluster',
  },
  {
    name: 'Message Queue',
    status: 'warning' as const,
    uptime: 98.5,
    responseTime: 18,
    lastChecked: new Date().toLocaleTimeString(),
    icon: Activity,
    description: 'RabbitMQ message broker',
  },
  {
    name: 'Auth Service',
    status: 'healthy' as const,
    uptime: 99.99,
    responseTime: 35,
    lastChecked: new Date().toLocaleTimeString(),
    icon: Server,
    description: 'Authentication & authorization',
  },
  {
    name: 'Storage',
    status: 'healthy' as const,
    uptime: 100,
    responseTime: 45,
    lastChecked: new Date().toLocaleTimeString(),
    icon: Database,
    description: 'S3-compatible object storage',
  },
];

// Recent incidents
const incidents = [
  {
    id: 1,
    title: 'High latency detected on Message Queue',
    severity: 'warning',
    timestamp: '2 hours ago',
    status: 'resolved',
    description: 'Increased message processing time due to high traffic',
  },
  {
    id: 2,
    title: 'Scheduled maintenance completed',
    severity: 'info',
    timestamp: '1 day ago',
    status: 'resolved',
    description: 'Database cluster upgrade to version 15.4 completed successfully',
  },
  {
    id: 3,
    title: 'Minor spike in API error rate',
    severity: 'resolved',
    timestamp: '3 days ago',
    status: 'resolved',
    description: 'Brief error rate increase due to deployment, auto-recovered',
  },
];

// System overview stats
const systemStats = {
  totalServices: 6,
  healthy: 5,
  warning: 1,
  critical: 0,
  overallUptime: 99.87,
  avgResponseTime: 32,
  requestsPerMinute: 1250,
  activeConnections: 847,
};

export default function HealthDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">BIZORA Health Dashboard</h1>
          <p className="text-slate-500 mt-1">System monitoring and status overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-status-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-status-green"></span>
          </span>
          <span className="text-sm font-medium text-slate-600">Live Monitoring</span>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Overall Uptime</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{systemStats.overallUptime}%</p>
            </div>
            <div className="p-3 bg-status-green-bg rounded-xl">
              <TrendingUp className="w-6 h-6 text-status-green" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Last 30 days</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Services Online</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {systemStats.healthy}/{systemStats.totalServices}
              </p>
            </div>
            <div className="p-3 bg-status-green-bg rounded-xl">
              <CheckCircle className="w-6 h-6 text-status-green" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            <span className="text-status-yellow">{systemStats.warning} warning</span>
            {systemStats.critical > 0 && <span className="text-status-red">, {systemStats.critical} critical</span>}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Avg Response Time</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{systemStats.avgResponseTime}ms</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Across all services</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Requests/min</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{systemStats.requestsPerMinute.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">{systemStats.activeConnections} active connections</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Response Time (ms)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={responseTimeData}>
              <defs>
                <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              />
              <Area type="monotone" dataKey="api" stroke="#3B82F6" fillOpacity={1} fill="url(#colorApi)" name="API" />
              <Area type="monotone" dataKey="database" stroke="#10B981" fillOpacity={1} fill="url(#colorDb)" name="Database" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-xs text-slate-600">API Gateway</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-xs text-slate-600">Database</span>
            </div>
          </div>
        </div>

        {/* Uptime Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Daily Uptime %</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={uptimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
              <YAxis domain={[99.5, 100]} stroke="#94A3B8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Uptime']}
              />
              <Line
                type="monotone"
                dataKey="uptime"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Health Cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Service Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <ServiceCard
              key={service.name}
              name={service.name}
              status={service.status}
              uptime={service.uptime}
              responseTime={service.responseTime}
              lastChecked={service.lastChecked}
              icon={service.icon}
              description={service.description}
            />
          ))}
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Recent Incidents</h2>
        </div>
        <div className="space-y-4">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div className={`mt-0.5 ${
                incident.severity === 'warning' ? 'text-status-yellow' :
                incident.severity === 'resolved' ? 'text-status-green' :
                'text-blue-500'
              }`}>
                {incident.severity === 'resolved' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900">{incident.title}</h3>
                  <StatusBadge status={incident.severity === 'warning' ? 'warning' : 'healthy'} />
                </div>
                <p className="text-sm text-slate-500 mt-1">{incident.description}</p>
                <p className="text-xs text-slate-400 mt-2">{incident.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-slate-400 pt-4">
        <p>BIZORA Health Dashboard - Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}

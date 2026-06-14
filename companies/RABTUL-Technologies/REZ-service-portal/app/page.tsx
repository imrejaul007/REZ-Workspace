'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Server, Activity, Zap, Clock, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { Service, DashboardStats, HealthSummary } from '@/lib/types';
import { ServiceCard } from '@/components/ServiceCard';
import { HealthSummary as HealthSummaryComponent, HealthBadge } from '@/components/HealthStatus';
import { formatRequestsPerMinute, formatResponseTime, getTimeAgo, cn } from '@/lib/utils';

export default function DashboardPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [servicesData, statsData, healthData] = await Promise.all([
        apiClient.getServices(),
        apiClient.getDashboardStats(),
        apiClient.getHealthSummary(),
      ]);
      setServices(servicesData);
      setStats(statsData);
      setHealthSummary(healthData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const criticalServices = services.filter(s => s.status === 'down' || s.status === 'degraded').slice(0, 3);
  const healthyServices = services.filter(s => s.status === 'healthy').slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">
              Overview of the REZ ecosystem services
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Last updated: {getTimeAgo(lastRefresh.toISOString())}
            </span>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            icon={<Server size={24} />}
            label="Total Services"
            value={stats?.totalServices ?? 0}
            trend={null}
            color="blue"
          />
          <StatCard
            icon={<Activity size={24} />}
            label="Healthy"
            value={stats?.healthyServices ?? 0}
            trend={null}
            color="green"
            suffix={`/ ${stats?.totalServices ?? 0}`}
          />
          <StatCard
            icon={<Zap size={24} />}
            label="Requests/min"
            value={formatRequestsPerMinute(stats?.totalRequests ?? 0)}
            trend={null}
            color="yellow"
          />
          <StatCard
            icon={<Clock size={24} />}
            label="Avg Response"
            value={formatResponseTime(stats?.avgResponseTime ?? 0)}
            trend={null}
            color="purple"
          />
        </div>

        {/* Health Summary */}
        <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">System Health</h2>
          {healthSummary && (
            <HealthSummaryComponent
              healthy={healthSummary.healthy}
              degraded={healthSummary.degraded}
              down={healthSummary.down}
              lastUpdated={healthSummary.lastUpdated}
            />
          )}
        </section>

        {/* Services Grid */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">All Services</h2>
            <Link
              href="/services"
              className="flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300"
            >
              View all
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>

        {/* Alerts Section */}
        {stats?.alerts && stats.alerts.length > 0 && (
          <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <AlertTriangle size={20} className="text-yellow-400" />
              Active Alerts
            </h2>
            <div className="space-y-3">
              {stats.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-4',
                    alert.type === 'error'
                      ? 'border-red-500/30 bg-red-500/5'
                      : alert.type === 'warning'
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-blue-500/30 bg-blue-500/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        alert.type === 'error' ? 'bg-red-400' :
                        alert.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                      )}
                    />
                    <div>
                      <p className="font-medium text-white">{alert.serviceName}</p>
                      <p className="text-sm text-slate-400">{alert.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">{getTimeAgo(alert.timestamp)}</p>
                    {!alert.acknowledged && (
                      <span className="mt-1 inline-block rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">
                        New
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend: number | null;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  suffix?: string;
}

function StatCard({ icon, label, value, trend, color, suffix }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <div className="flex items-center gap-4">
        <div className={cn('rounded-lg border p-3', colorClasses[color])}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{value}</span>
            {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

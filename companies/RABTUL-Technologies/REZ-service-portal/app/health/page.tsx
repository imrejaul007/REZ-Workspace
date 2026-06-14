'use client';

import { useEffect, useState } from 'react';
import { Heart, RefreshCw, CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { HealthCheck, HealthSummary, Service } from '@/lib/types';
import { HealthBadge, HealthSummary as HealthSummaryComponent, HealthIndicator } from '@/components/HealthStatus';
import { cn, getTimeAgo } from '@/lib/utils';

export default function HealthPage() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'degraded' | 'down'>('all');

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const [checks, summary, servicesData] = await Promise.all([
        apiClient.getHealthChecks(),
        apiClient.getHealthSummary(),
        apiClient.getServices(),
      ]);
      setHealthChecks(checks);
      setHealthSummary(summary);
      setServices(servicesData);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredChecks = healthChecks.filter((check) =>
    statusFilter === 'all' || check.status === statusFilter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="text-green-400" size={24} />;
      case 'degraded':
        return <AlertCircle className="text-yellow-400" size={24} />;
      case 'down':
        return <XCircle className="text-red-400" size={24} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Health Overview</h1>
              <p className="mt-1 text-sm text-slate-400">
                Real-time health status of all services
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
                Auto-refresh: 10s
              </div>
              <button
                onClick={fetchHealthData}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Summary Cards */}
        {healthSummary && (
          <div className="grid grid-cols-4 gap-6">
            <HealthCard
              title="Total Services"
              count={healthSummary.total}
              icon={<Heart size={24} />}
              color="slate"
            />
            <HealthCard
              title="Healthy"
              count={healthSummary.healthy}
              icon={<CheckCircle2 size={24} />}
              color="green"
            />
            <HealthCard
              title="Degraded"
              count={healthSummary.degraded}
              icon={<AlertCircle size={24} />}
              color="yellow"
            />
            <HealthCard
              title="Down"
              count={healthSummary.down}
              icon={<XCircle size={24} />}
              color="red"
            />
          </div>
        )}

        {/* Health Bar */}
        {healthSummary && (
          <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">System Health</h2>
            <HealthSummaryComponent
              healthy={healthSummary.healthy}
              degraded={healthSummary.degraded}
              down={healthSummary.down}
              lastUpdated={healthSummary.lastUpdated}
            />
          </section>
        )}

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Filter:</span>
          {(['all', 'healthy', 'degraded', 'down'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                statusFilter === status
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Health Checks List */}
        <section className="space-y-3">
          {loading && healthChecks.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-brand-500" />
            </div>
          ) : filteredChecks.length === 0 ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
              <Heart className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">No services match the current filter</p>
            </div>
          ) : (
            filteredChecks.map((check) => {
              const service = services.find((s) => s.id === check.serviceId);
              return (
                <div
                  key={check.serviceId}
                  className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 p-5"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(check.status)}
                    <div>
                      <h3 className="font-semibold text-white">{check.serviceName}</h3>
                      <div className="mt-1 flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          Latency: {check.latency > 0 ? `${check.latency}ms` : '-'}
                        </span>
                        <span>
                          Response: {check.responseCode > 0 ? check.responseCode : 'N/A'}
                        </span>
                        {check.message && (
                          <span className="text-red-400">{check.message}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">
                        Last checked: {getTimeAgo(check.lastChecked)}
                      </p>
                    </div>
                    <HealthBadge status={check.status} />
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}

interface HealthCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: 'slate' | 'green' | 'yellow' | 'red';
}

function HealthCard({ title, count, icon, color }: HealthCardProps) {
  const colorClasses = {
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <div className={cn('rounded-xl border p-6', colorClasses[color])}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-70">{title}</p>
          <p className="mt-1 text-3xl font-bold">{count}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

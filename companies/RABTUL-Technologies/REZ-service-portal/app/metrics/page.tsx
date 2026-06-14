'use client';

import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { Service, ServiceMetrics } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function MetricsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await apiClient.getServices();
        setServices(data);
        if (data.length > 0) {
          setSelectedService(data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    if (!selectedService) return;

    const fetchMetrics = async () => {
      try {
        const data = await apiClient.getServiceMetrics(selectedService);
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [selectedService]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Metrics Dashboard</h1>
              <p className="mt-1 text-sm text-slate-400">
                Performance metrics and analytics
              </p>
            </div>
            <select
              value={selectedService || ''}
              onChange={(e) => setSelectedService(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Current Metrics */}
        {metrics && (
          <>
            <div className="grid grid-cols-4 gap-6">
              <MetricCard
                title="Current Requests/min"
                value={metrics.requests[metrics.requests.length - 1]?.value.toFixed(0) || '0'}
                trend={calculateTrend(metrics.requests)}
                icon={<TrendingUp size={20} />}
                color="blue"
              />
              <MetricCard
                title="Avg Response Time"
                value={`${(metrics.responseTime.reduce((a, b) => a + b.value, 0) / metrics.responseTime.length).toFixed(0)}ms`}
                trend={calculateTrend(metrics.responseTime)}
                icon={<TrendingDown size={20} />}
                color="purple"
              />
              <MetricCard
                title="Error Rate"
                value={`${(metrics.errorRate.reduce((a, b) => a + b.value, 0) / metrics.errorRate.length).toFixed(2)}%`}
                trend={calculateTrend(metrics.errorRate, true)}
                icon={<TrendingUp size={20} />}
                color="red"
              />
              <MetricCard
                title="CPU Usage"
                value={`${(metrics.cpuUsage.reduce((a, b) => a + b.value, 0) / metrics.cpuUsage.length).toFixed(0)}%`}
                trend={calculateTrend(metrics.cpuUsage)}
                icon={<BarChart3 size={20} />}
                color="green"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-6">
              <ChartCard title="Requests (24h)">
                <SimpleChart data={metrics.requests} color="blue" />
              </ChartCard>
              <ChartCard title="Response Time (24h)">
                <SimpleChart data={metrics.responseTime} color="purple" unit="ms" />
              </ChartCard>
              <ChartCard title="Error Rate (24h)">
                <SimpleChart data={metrics.errorRate} color="red" unit="%" />
              </ChartCard>
              <ChartCard title="CPU Usage (24h)">
                <SimpleChart data={metrics.cpuUsage} color="green" unit="%" />
              </ChartCard>
            </div>

            {/* Memory Usage */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Memory Usage</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                      style={{
                        width: `${(metrics.memoryUsage[metrics.memoryUsage.length - 1]?.value || 0)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-lg font-semibold text-white">
                  {metrics.memoryUsage[metrics.memoryUsage.length - 1]?.value.toFixed(0) || 0}%
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Average: {metrics.memoryUsage.reduce((a, b) => a + b.value, 0) / metrics.memoryUsage.length.toFixed(1)}%
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  trend: number;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'red' | 'green';
}

function MetricCard({ title, value, trend, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
  };

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-slate-400';

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{title}</span>
        <div className={cn('rounded-lg p-2', colorClasses[color])}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <span className="text-3xl font-bold text-white">{value}</span>
        <div className={cn('flex items-center gap-1 text-sm', trendColor)}>
          <TrendIcon size={16} />
          <span>{Math.abs(trend).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3>
      <div className="h-48">
        {children}
      </div>
    </div>
  );
}

function SimpleChart({
  data,
  color,
  unit = '',
}: {
  data: { timestamp: string; value: number }[];
  color: 'blue' | 'purple' | 'red' | 'green';
  unit?: string;
}) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;

  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
  };

  return (
    <div className="relative h-full">
      <svg className="h-full w-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1="0"
            y1={`${tick * 100}%`}
            x2="100%"
            y2={`${tick * 100}%`}
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeDasharray="4"
          />
        ))}

        {/* Area */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorClasses[color]} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colorClasses[color]} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Fill area */}
        <path
          d={`
            M 0 ${100 - ((data[0]?.value - min) / range) * 100}
            ${data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = 100 - ((d.value - min) / range) * 100;
              return `L ${x} ${y}`;
            }).join(' ')}
            L 100 100
            L 0 100
            Z
          `}
          fill={`url(#gradient-${color})`}
        />

        {/* Line */}
        <path
          d={`
            M 0 ${100 - ((data[0]?.value - min) / range) * 100}
            ${data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = 100 - ((d.value - min) / range) * 100;
              return `L ${x} ${y}`;
            }).join(' ')}
          `}
          fill="none"
          stroke={colorClasses[color]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Current value badge */}
      <div className="absolute right-2 top-2 rounded-lg bg-slate-900/80 px-2 py-1 text-xs font-medium text-white">
        {data[data.length - 1]?.value.toFixed(1)}{unit}
      </div>
    </div>
  );
}

function calculateTrend(data: { timestamp: string; value: number }[], inverse = false): number {
  if (data.length < 2) return 0;

  const recent = data.slice(-6);
  const older = data.slice(-12, -6);

  if (older.length === 0) return 0;

  const recentAvg = recent.reduce((a, b) => a + b.value, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b.value, 0) / older.length;

  if (olderAvg === 0) return 0;

  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  return inverse ? -change : change;
}

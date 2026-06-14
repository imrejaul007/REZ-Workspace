'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Activity,
  Clock,
  Zap,
  AlertTriangle,
  Server,
  User,
  Tag,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { Service } from '@/lib/types';
import { HealthBadge } from '@/components/HealthStatus';
import {
  cn,
  formatUptime,
  formatResponseTime,
  formatRequestsPerMinute,
  formatErrorRate,
  formatTimestamp,
  getCategoryColor,
  getCategoryLabel,
  getTimeAgo,
} from '@/lib/utils';

export default function ServiceDetailPage() {
  const params = useParams();
  const serviceId = params.id as string;
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints'>('overview');

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      try {
        const data = await apiClient.getService(serviceId);
        setService(data);
      } catch (error) {
        console.error('Failed to fetch service:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <Server className="h-16 w-16 text-slate-600" />
        <h2 className="mt-4 text-xl font-semibold text-white">Service not found</h2>
        <p className="mt-2 text-slate-400">The service &quot;{serviceId}&quot; does not exist.</p>
        <Link
          href="/services"
          className="mt-6 flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400"
        >
          <ArrowLeft size={16} />
          Back to Services
        </Link>
      </div>
    );
  }

  const StatusIcon = service.status === 'healthy'
    ? CheckCircle2
    : service.status === 'degraded'
    ? AlertCircle
    : XCircle;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/services"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft size={18} />
              Back to Services
            </Link>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Service Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex h-16 w-16 items-center justify-center rounded-2xl',
                service.status === 'healthy' ? 'bg-green-500/10' :
                service.status === 'degraded' ? 'bg-yellow-500/10' : 'bg-red-500/10'
              )}>
                <StatusIcon
                  size={32}
                  className={service.status === 'healthy' ? 'text-green-400' :
                    service.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'}
                />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{service.name}</h1>
                  <HealthBadge status={service.status} size="lg" />
                </div>
                <p className="mt-1 text-slate-400">{service.description}</p>
              </div>
            </div>
            <a
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
            >
              <ExternalLink size={16} />
              Open Service
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-4 gap-6">
          <DetailStat
            icon={<Activity size={20} />}
            label="Uptime"
            value={formatUptime(service.uptime)}
            color={service.uptime >= 99 ? 'green' : service.uptime >= 95 ? 'yellow' : 'red'}
          />
          <DetailStat
            icon={<Clock size={20} />}
            label="Avg Response"
            value={service.avgResponseTime > 0 ? formatResponseTime(service.avgResponseTime) : '-'}
            color="blue"
          />
          <DetailStat
            icon={<Zap size={20} />}
            label="Requests/min"
            value={service.requestsPerMinute > 0 ? formatRequestsPerMinute(service.requestsPerMinute) : '-'}
            color="purple"
          />
          <DetailStat
            icon={<AlertTriangle size={20} />}
            label="Error Rate"
            value={service.errorRate > 0 ? formatErrorRate(service.errorRate) : '-'}
            color={service.errorRate < 1 ? 'green' : service.errorRate < 5 ? 'yellow' : 'red'}
          />
        </div>

        {/* Info Cards */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          <InfoCard
            icon={<Server size={18} />}
            label="Port"
            value={service.port.toString()}
          />
          <InfoCard
            icon={<Tag size={18} />}
            label="Version"
            value={`v${service.version}`}
          />
          <InfoCard
            icon={<User size={18} />}
            label="Owner"
            value={service.owner}
          />
          <InfoCard
            icon={<Calendar size={18} />}
            label="Last Checked"
            value={getTimeAgo(service.lastChecked)}
          />
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-700">
          <div className="flex gap-6">
            {(['overview', 'endpoints'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'border-b-2 pb-3 text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'border-brand-500 text-brand-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                )}
              >
                {tab === 'overview' ? 'Overview' : 'API Endpoints'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Category & Documentation */}
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <h3 className="mb-4 text-sm font-medium text-slate-400">Category</h3>
                <span className={cn(
                  'inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium',
                  getCategoryColor(service.category)
                )}>
                  {getCategoryLabel(service.category)}
                </span>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <h3 className="mb-4 text-sm font-medium text-slate-400">Documentation</h3>
                <p className="text-white">
                  {service.documentation || 'No documentation available'}
                </p>
              </div>
            </div>

            {/* Base URL */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="mb-4 text-sm font-medium text-slate-400">Base URL</h3>
              <div className="flex items-center gap-3">
                <code className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-brand-400">
                  {service.url}
                </code>
                <button className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600">
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'endpoints' && (
          <div className="space-y-4">
            {service.endpoints.map((endpoint, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-700 bg-slate-800/50 p-6"
              >
                <div className="flex items-start gap-4">
                  <MethodBadge method={endpoint.method} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-brand-400">{endpoint.path}</code>
                      {endpoint.authenticated && (
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                          Auth Required
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{endpoint.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'purple';
}) {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
      <div className={cn('mb-3 inline-flex rounded-lg p-2', colorClasses[color])}>
        {icon}
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-1 font-medium text-white">{value}</p>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-400',
    POST: 'bg-blue-500/20 text-blue-400',
    PUT: 'bg-yellow-500/20 text-yellow-400',
    PATCH: 'bg-purple-500/20 text-purple-400',
    DELETE: 'bg-red-500/20 text-red-400',
  };

  return (
    <span
      className={cn(
        'rounded-md px-2 py-1 text-xs font-bold',
        colors[method] || 'bg-slate-500/20 text-slate-400'
      )}
    >
      {method}
    </span>
  );
}

'use client';

import Link from 'next/link';
import { ArrowRight, Clock, Activity, Zap, AlertTriangle, XCircle } from 'lucide-react';
import type { Service } from '@/lib/types';
import { HealthBadge } from './HealthStatus';
import { cn, getCategoryColor, getCategoryLabel, formatUptime, formatResponseTime, formatRequestsPerMinute, formatErrorRate } from '@/lib/utils';

interface ServiceCardProps {
  service: Service;
  compact?: boolean;
}

export function ServiceCard({ service, compact = false }: ServiceCardProps) {
  const StatusIcon = service.status === 'healthy'
    ? Activity
    : service.status === 'degraded'
    ? AlertTriangle
    : XCircle;

  if (compact) {
    return (
      <Link
        href={`/services/${service.id}`}
        className="flex items-center justify-between rounded-lg border border-surface-700 bg-surface-800/50 p-4 transition-all hover:border-surface-600 hover:bg-surface-800"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            service.status === 'healthy' ? 'bg-green-500/10' :
            service.status === 'degraded' ? 'bg-yellow-500/10' : 'bg-red-500/10'
          )}>
            <StatusIcon
              size={20}
              className={service.status === 'healthy' ? 'text-green-400' :
                service.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'}
            />
          </div>
          <div>
            <h3 className="font-medium text-white">{service.name}</h3>
            <p className="text-sm text-slate-400">Port {service.port}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <HealthBadge status={service.status} />
          <ArrowRight size={16} className="text-slate-500" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/services/${service.id}`}
      className="group block rounded-xl border border-surface-700 bg-surface-800/50 p-5 transition-all hover:border-surface-600 hover:bg-surface-800"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            service.status === 'healthy' ? 'bg-green-500/10' :
            service.status === 'degraded' ? 'bg-yellow-500/10' : 'bg-red-500/10'
          )}>
            <StatusIcon
              size={24}
              className={service.status === 'healthy' ? 'text-green-400' :
                service.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'}
            />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-brand-400 transition-colors">
              {service.name}
            </h3>
            <p className="mt-0.5 text-sm text-slate-400">{service.description}</p>
          </div>
        </div>
        <HealthBadge status={service.status} />
      </div>

      {/* Category Badge */}
      <div className="mb-4">
        <span className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
          getCategoryColor(service.category)
        )}>
          {getCategoryLabel(service.category)}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface-900/50 p-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Activity size={12} />
            <span>Uptime</span>
          </div>
          <p className={cn(
            'mt-0.5 font-semibold',
            service.uptime >= 99 ? 'text-green-400' :
            service.uptime >= 95 ? 'text-yellow-400' : 'text-red-400'
          )}>
            {formatUptime(service.uptime)}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock size={12} />
            <span>Response</span>
          </div>
          <p className="mt-0.5 font-semibold text-slate-300">
            {service.avgResponseTime > 0 ? formatResponseTime(service.avgResponseTime) : '-'}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Zap size={12} />
            <span>RPM</span>
          </div>
          <p className="mt-0.5 font-semibold text-slate-300">
            {service.requestsPerMinute > 0 ? formatRequestsPerMinute(service.requestsPerMinute) : '-'}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <AlertTriangle size={12} />
            <span>Error Rate</span>
          </div>
          <p className={cn(
            'mt-0.5 font-semibold',
            service.errorRate < 1 ? 'text-green-400' :
            service.errorRate < 5 ? 'text-yellow-400' : 'text-red-400'
          )}>
            {service.errorRate > 0 ? formatErrorRate(service.errorRate) : '-'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-surface-700 pt-4">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>Port: {service.port}</span>
          <span>v{service.version}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-brand-400 opacity-0 transition-opacity group-hover:opacity-100">
          <span>View Details</span>
          <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
}

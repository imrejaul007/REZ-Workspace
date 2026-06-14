'use client';

import { cn } from '@/lib/utils';
import type { HealthStatus } from '@/lib/types';

interface HealthBadgeProps {
  status: HealthStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<HealthStatus, { label: string; className: string; dotClass: string }> = {
  healthy: {
    label: 'Healthy',
    className: 'bg-green-500/10 text-green-400 border-green-500/30',
    dotClass: 'bg-green-400',
  },
  degraded: {
    label: 'Degraded',
    className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    dotClass: 'bg-yellow-400',
  },
  down: {
    label: 'Down',
    className: 'bg-red-500/10 text-red-400 border-red-500/30',
    dotClass: 'bg-red-400',
  },
};

export function HealthBadge({ status, showLabel = true, size = 'md' }: HealthBadgeProps) {
  const config = statusConfig[status];

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.className,
        sizeClasses[size]
      )}
    >
      <span className={cn('rounded-full', config.dotClass, dotSizes[size])} />
      {showLabel && config.label}
    </span>
  );
}

interface HealthIndicatorProps {
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export function HealthIndicator({ status, size = 'md', pulse = false }: HealthIndicatorProps) {
  const dotSizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const colors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500',
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        colors[status],
        dotSizes[size],
        pulse && status === 'healthy' && 'animate-pulse'
      )}
    />
  );
}

interface HealthBarProps {
  healthy: number;
  degraded: number;
  down: number;
  total: number;
}

export function HealthBar({ healthy, degraded, down, total }: HealthBarProps) {
  const getPercentage = (count: number) => (total > 0 ? (count / total) * 100 : 0);

  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-surface-700">
      <div
        className="bg-green-500 transition-all"
        style={{ width: `${getPercentage(healthy)}%` }}
      />
      <div
        className="bg-yellow-500 transition-all"
        style={{ width: `${getPercentage(degraded)}%` }}
      />
      <div
        className="bg-red-500 transition-all"
        style={{ width: `${getPercentage(down)}%` }}
      />
    </div>
  );
}

interface HealthSummaryProps {
  healthy: number;
  degraded: number;
  down: number;
  lastUpdated: string;
}

export function HealthSummary({ healthy, degraded, down, lastUpdated }: HealthSummaryProps) {
  const total = healthy + degraded + down;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-sm text-slate-400">Healthy</span>
            <span className="font-semibold text-white">{healthy}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="text-sm text-slate-400">Degraded</span>
            <span className="font-semibold text-white">{degraded}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm text-slate-400">Down</span>
            <span className="font-semibold text-white">{down}</span>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      </div>
      <HealthBar healthy={healthy} degraded={degraded} down={down} total={total} />
    </div>
  );
}

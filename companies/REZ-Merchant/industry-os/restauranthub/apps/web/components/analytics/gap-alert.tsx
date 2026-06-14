'use client';

/**
 * GapAlert — renders top operational gaps as alert cards with severity color,
 * metric comparison, and a link to the relevant training module.
 *
 * This component is part of the cross-agent interface with Agent A7 (Training).
 * It is imported by Agent A7's training page to surface gaps inline.
 * Export shape must remain stable.
 */

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, AlertCircle, Info, BookOpen, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Mirrors analytics.dto.ts OperationalGap — keep in sync with A7 expectations
export interface OperationalGap {
  metric: string;
  yourValue: number;
  peerAvg: number;
  gapPercent: number;
  severity: 'high' | 'medium' | 'low';
  trainingModuleSlug: string;
}

export interface GapAlertProps {
  gaps: OperationalGap[];
  /** Optional: override the training base path (default /training) */
  trainingBasePath?: string;
}

const severityConfig = {
  high: {
    icon: AlertTriangle,
    containerClass: 'border-red-200 bg-red-50',
    iconClass: 'text-red-600',
    badgeClass: 'bg-red-100 text-red-700',
    label: 'High priority',
  },
  medium: {
    icon: AlertCircle,
    containerClass: 'border-amber-200 bg-amber-50',
    iconClass: 'text-amber-600',
    badgeClass: 'bg-amber-100 text-amber-700',
    label: 'Medium priority',
  },
  low: {
    icon: Info,
    containerClass: 'border-blue-200 bg-blue-50',
    iconClass: 'text-blue-600',
    badgeClass: 'bg-blue-100 text-blue-700',
    label: 'Low priority',
  },
};

function formatValue(value: number, metric: string): string {
  const isPct = metric.includes('%');
  const isRupee = metric.includes('₹');

  if (isRupee) {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toLocaleString('en-IN')}`;
  }
  if (isPct) return `${value}%`;
  return String(value);
}

function GapCard({ gap, trainingBasePath }: { gap: OperationalGap; trainingBasePath: string }) {
  const config = severityConfig[gap.severity];
  const Icon = config.icon;

  return (
    <Card className={cn('border', config.containerClass)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', config.iconClass)} />

          <div className="flex-1 min-w-0 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{gap.metric}</p>
              <Badge className={cn('text-xs whitespace-nowrap', config.badgeClass)}>
                {config.label}
              </Badge>
            </div>

            {/* Comparison */}
            <p className="text-sm text-muted-foreground">
              Your value:{' '}
              <span className="font-semibold text-foreground">{formatValue(gap.yourValue, gap.metric)}</span>
              {' — '}Peer avg:{' '}
              <span className="font-semibold">{formatValue(gap.peerAvg, gap.metric)}</span>
              {' '}
              <span className="text-muted-foreground">({gap.gapPercent}% gap)</span>
            </p>

            {/* CTA */}
            <Link
              href={`${trainingBasePath}/${gap.trainingModuleSlug}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <BookOpen className="h-3.5 w-3.5" />
              View training module
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GapAlert({ gaps, trainingBasePath = '/training' }: GapAlertProps) {
  if (!gaps || gaps.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 flex items-center gap-3">
          <Info className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800 font-medium">
            You are performing at or above peer averages across all key metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const topThree = gaps.slice(0, 3);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">
        Top operational gaps vs. peer restaurants
      </p>
      {topThree.map((gap, i) => (
        <GapCard key={`${gap.trainingModuleSlug}-${i}`} gap={gap} trainingBasePath={trainingBasePath} />
      ))}
    </div>
  );
}

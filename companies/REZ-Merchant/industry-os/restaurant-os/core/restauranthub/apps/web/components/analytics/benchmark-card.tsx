'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, BookOpen } from 'lucide-react';

export interface BenchmarkCardProps {
  metric: string;
  yourValue: number;
  peerAvg: number;
  percentile: number;
  /** '%', '₹', or unknown suffix appended after the number */
  unit: string;
  /** Agent A7 training slug — shown as "Improve" link when below avg */
  trainingSlug?: string;
}

type PerformanceStatus = 'green' | 'amber' | 'red';

function getStatus(yourValue: number, peerAvg: number, unit: string): PerformanceStatus {
  if (peerAvg === 0) return 'green';

  // Cost metrics (unit '%' AND label contains 'Cost') are inverted: lower is better.
  // We detect cost metrics by checking if the value is above peer avg.
  const isCostMetric = unit === '%' && yourValue > peerAvg;
  const diff = isCostMetric
    ? ((yourValue - peerAvg) / peerAvg) * 100
    : ((peerAvg - yourValue) / peerAvg) * 100;

  if (diff <= 0) return 'green';
  if (diff <= 10) return 'amber';
  return 'red';
}

function formatValue(value: number, unit: string): string {
  if (unit === '₹') {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toLocaleString('en-IN')}`;
  }
  if (unit === '%') return `${value}%`;
  return `${value}${unit}`;
}

const statusStyles: Record<PerformanceStatus, string> = {
  green: 'border-l-green-500',
  amber: 'border-l-amber-400',
  red: 'border-l-red-500',
};

const badgeStyles: Record<PerformanceStatus, string> = {
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
};

const statusLabel: Record<PerformanceStatus, string> = {
  green: 'At or above avg',
  amber: 'Slightly below avg',
  red: 'Below avg',
};

export function BenchmarkCard({
  metric,
  yourValue,
  peerAvg,
  percentile,
  unit,
  trainingSlug,
}: BenchmarkCardProps) {
  const status = getStatus(yourValue, peerAvg, unit);
  const isBelow = status !== 'green';

  return (
    <Card className={cn('border-l-4 transition-shadow hover:shadow-md', statusStyles[status])}>
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <p className="text-sm font-semibold text-foreground">{metric}</p>
          <Badge className={cn('text-xs font-medium', badgeStyles[status])}>
            {statusLabel[status]}
          </Badge>
        </div>

        {/* Value comparison */}
        <div className="flex items-end gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Your value</p>
            <p className="text-2xl font-bold text-foreground">{formatValue(yourValue, unit)}</p>
          </div>
          <div className="pb-1 flex items-center gap-1 text-muted-foreground">
            {isBelow ? (
              <TrendingDown className="h-4 w-4 text-red-400" />
            ) : (
              <TrendingUp className="h-4 w-4 text-green-500" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Peer avg</p>
            <p className="text-lg font-semibold text-muted-foreground">{formatValue(peerAvg, unit)}</p>
          </div>
        </div>

        {/* Percentile bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Percentile</span>
            <span className="font-medium">{percentile}th</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                status === 'green' ? 'bg-green-500' :
                status === 'amber' ? 'bg-amber-400' :
                'bg-red-500'
              )}
              style={{ width: `${Math.max(2, percentile)}%` }}
            />
          </div>
        </div>

        {/* Benchmark callout text */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isBelow
            ? `You are in the ${percentile}th percentile. Peer avg is ${formatValue(peerAvg, unit)}.`
            : `Performing at or above the ${formatValue(peerAvg, unit)} peer average.`}
        </p>

        {/* Training CTA — only for red metrics */}
        {status === 'red' && trainingSlug && (
          <Link
            href={`/training/${trainingSlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <BookOpen className="h-3.5 w-3.5" />
            How to improve
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCustomerSegments } from '@/lib/api/customerAnalytics';
import { formatINR } from '@/lib/utils/currency';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import type { CustomerSegment, CustomerSegmentType } from '@/lib/types';

const SEGMENT_META: Record<CustomerSegmentType, { label: string; description: string; color: string; bgColor: string; borderColor: string; badgeVariant: 'blue' | 'green' | 'yellow' | 'indigo' | 'gray' }> = {
  new: {
    label: 'New Customers',
    description: 'First-time visitors',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeVariant: 'blue',
  },
  repeat: {
    label: 'Repeat Customers',
    description: 'Visited 2+ times',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    badgeVariant: 'green',
  },
  at_risk: {
    label: 'At Risk',
    description: 'No visit in 14+ days',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    badgeVariant: 'yellow',
  },
  vip: {
    label: 'VIP',
    description: 'High-value loyal customers',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    badgeVariant: 'indigo',
  },
};

function formatPaise(paise: number): string {
  return formatINR(paise);
}

export default function CustomerSegments() {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomerSegments('');
      setSegments(data.segments);
      setTotalCustomers(data.totalCustomers);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load segments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        <p>Could not load segments.</p>
        <button onClick={load} className="mt-2 text-indigo-600 hover:underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total customers header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Customer Segments</h2>
        <span className="text-sm text-gray-500">{totalCustomers} total customers</span>
      </div>

      {/* Segment cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {segments.map((seg) => {
          const meta = SEGMENT_META[seg.type];
          return (
            <div
              key={seg.type}
              className={cn(
                'rounded-xl border p-4 flex flex-col gap-2',
                meta.bgColor,
                meta.borderColor,
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn('text-xs font-medium uppercase tracking-wide', meta.color)}>
                  {meta.label}
                </div>
                <Badge variant={meta.badgeVariant}>{seg.count}</Badge>
              </div>
              <div className={cn('text-xl font-bold', meta.color)}>
                {seg.count}
                <span className="text-xs font-normal ml-1 opacity-70">customers</span>
              </div>
              <div className="text-xs text-gray-500">
                Avg: {seg.avgOrderValue > 0 ? formatPaise(seg.avgOrderValue) : '—'}
              </div>
              <div className="text-xs text-gray-500">
                Revenue: {seg.totalRevenue > 0 ? formatPaise(seg.totalRevenue) : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

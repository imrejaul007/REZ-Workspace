'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRecentCustomers } from '@/lib/api/customerAnalytics';
import { formatINR } from '@/lib/utils/currency';
import Badge from '@/components/ui/Badge';
import type { CustomerSummary, CustomerSegmentType } from '@/lib/types';

function formatPaise(paise: number): string {
  return formatINR(paise);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function segmentBadge(seg: CustomerSegmentType): { label: string; variant: 'blue' | 'green' | 'yellow' | 'indigo' | 'gray' } {
  switch (seg) {
    case 'vip': return { label: 'VIP', variant: 'indigo' };
    case 'at_risk': return { label: 'At Risk', variant: 'yellow' };
    case 'repeat': return { label: 'Repeat', variant: 'green' };
    case 'new': return { label: 'New', variant: 'blue' };
  }
}

function inferSegment(c: CustomerSummary): CustomerSegmentType {
  if (c.visitCount >= 10 && c.totalSpent >= 50000) return 'vip';
  const daysSince = Math.floor((Date.now() - new Date(c.lastVisit).getTime()) / 86400000);
  if (daysSince >= 14) return 'at_risk';
  if (c.visitCount === 1) return 'new';
  return 'repeat';
}

interface CustomerListProps {
  storeSlug: string;
  pageSize?: number;
}

export default function CustomerList({ storeSlug, pageSize = 10 }: CustomerListProps) {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecentCustomers(storeSlug, 20);
      setCustomers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        <p>Could not load customers.</p>
        <button onClick={load} className="mt-2 text-indigo-600 hover:underline">Try again</button>
      </div>
    );
  }

  const visible = customers.slice(0, visibleCount);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Recent Customers</h2>
        <span className="text-xs text-gray-400">{customers.length} shown</span>
      </div>

      {/* Table header */}
      <div className="hidden sm:grid grid-cols-5 gap-2 px-3">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Customer</div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide text-center">Visits</div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide text-right">Total Spent</div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide text-center">Segment</div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide text-right">Last Visit</div>
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {visible.map((c) => {
          const seg = inferSegment(c);
          const { label, variant } = segmentBadge(seg);
          return (
            <div
              key={c.customerId}
              className="bg-white border border-gray-200 rounded-xl p-3 sm:p-3 flex flex-col sm:grid sm:grid-cols-5 sm:items-center gap-2 hover:border-indigo-200 transition-colors"
            >
              {/* Mobile layout */}
              <div className="sm:hidden space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {c.name || c.phone}
                  </span>
                  <Badge variant={variant}>{label}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{c.visitCount}x visits</span>
                  <span>{formatPaise(c.totalSpent)}</span>
                  <span>{formatDate(c.lastVisit)}</span>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:flex sm:flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {c.name || <span className="text-gray-400">Unknown</span>}
                </span>
                <span className="text-xs text-gray-400">{c.phone}</span>
              </div>
              <div className="hidden sm:text-center">
                <span className="text-sm font-semibold text-gray-800">{c.visitCount}</span>
              </div>
              <div className="hidden sm:text-right">
                <span className="text-sm font-semibold text-gray-900">{formatPaise(c.totalSpent)}</span>
                <div className="text-xs text-gray-400">avg {formatPaise(c.avgOrderValue)}</div>
              </div>
              <div className="hidden sm:flex sm:items-center sm:justify-center">
                <Badge variant={variant}>{label}</Badge>
              </div>
              <div className="hidden sm:text-right">
                <span className="text-sm text-gray-600">{formatDate(c.lastVisit)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {visibleCount < customers.length && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setVisibleCount((v) => v + pageSize)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Load more ({customers.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

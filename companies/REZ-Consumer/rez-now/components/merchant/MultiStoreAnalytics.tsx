'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAggregateStats, AggregateStats } from '@/lib/api/merchant';
import { formatINR } from '@/lib/utils/currency';

interface MultiStoreAnalyticsProps {
  merchantId?: string;
  selectedOutlet?: string; // undefined = all outlets
}

function formatPaise(paise: number): string {
  return formatINR(paise / 100);
}

export default function MultiStoreAnalytics({ selectedOutlet }: MultiStoreAnalyticsProps) {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAggregateStats();
      setStats(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
        <div className="h-24 bg-gray-100 rounded-xl" />
        <div className="h-24 bg-gray-100 rounded-xl" />
        <div className="h-48 bg-gray-100 rounded-xl sm:col-span-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        <p>Could not load analytics.</p>
        <button onClick={loadStats} className="mt-2 text-indigo-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const displayData = selectedOutlet
    ? stats.outletBreakdown.filter((o) => o.slug === selectedOutlet)
    : stats.outletBreakdown;

  const maxRevenue = Math.max(...stats.outletBreakdown.map((o) => o.revenue), 1);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-sm">
          <div className="text-xs font-medium text-indigo-100 uppercase tracking-wide mb-1">Total Revenue</div>
          <div className="text-2xl font-bold">{formatPaise(stats.totalRevenue)}</div>
          <div className="text-xs text-indigo-200 mt-1">Today across all outlets</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
          <div className="text-xs text-gray-400 mt-1">Today across all outlets</div>
        </div>
      </div>

      {/* Per-outlet breakdown (shown when "All outlets" is selected) */}
      {!selectedOutlet && stats.outletBreakdown.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Outlet Performance</h3>
          <div className="space-y-3">
            {stats.outletBreakdown.map((outlet) => {
              const barWidth = Math.round((outlet.revenue / maxRevenue) * 100);
              return (
                <div key={outlet.slug}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{outlet.name}</span>
                      <span className="text-xs text-gray-400">#{outlet.slug}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPaise(outlet.revenue)}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">{outlet.orders} orders</span>
                    </div>
                  </div>
                  {/* Bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Single outlet view */}
      {selectedOutlet && displayData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {displayData[0].name} — Today
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">{formatPaise(displayData[0].revenue)}</div>
              <div className="text-xs text-gray-500">Revenue</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">{displayData[0].orders}</div>
              <div className="text-xs text-gray-500">Orders</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

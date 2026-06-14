'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import {
  getStoreAnalytics,
  getPopularLinks,
  getTimeSeriesData,
  type StoreAnalytics,
  type LinkClickData,
  type TimeSeriesData,
  type AnalyticsPeriod,
} from '@/lib/api/analytics';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalViews: number;
  totalLinkClicks: number;
  totalQRCScans: number;
  totalDownloads: number;
}

// ── Icons ────────────────────────────────────────────────────────────────────────

function ViewsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cn('w-6 h-6', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ClickIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cn('w-6 h-6', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
    </svg>
  );
}

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cn('w-6 h-6', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM3.75 12h16.5M12 3.75v16.5" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cn('w-6 h-6', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function TrendUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cn('w-4 h-4', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}

function TrendDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cn('w-4 h-4', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cn('w-5 h-5', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cn('w-5 h-5', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

// ── Helper functions ───────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getPeriodLabel(period: AnalyticsPeriod): string {
  switch (period) {
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    case '90d':
      return 'Last 90 days';
    case '365d':
      return 'Last year';
  }
}

// ── Chart Component ────────────────────────────────────────────────────────────

interface ChartProps {
  data: TimeSeriesData[];
  color?: string;
  className?: string;
}

function SimpleChart({ data, color = '#4F46E5', className }: ChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-32 text-gray-400 text-sm', className)}>
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const width = 100;
  const height = 100;
  const padding = 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.value / maxValue) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-32"
        preserveAspectRatio="none"
      >
        {/* Area fill */}
        <polygon
          points={areaPoints}
          fill={color}
          fillOpacity={0.1}
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Dots */}
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1)) * (width - padding * 2);
          const y = height - padding - (d.value / maxValue) * (height - padding * 2);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={2}
              fill={color}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
    </div>
  );
}

// ── Stat Card Component ────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  change?: number;
  iconBgColor?: string;
  iconColor?: string;
}

function StatCard({ title, value, icon, change, iconBgColor = 'bg-indigo-50', iconColor = 'text-indigo-600' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(value)}</p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-1', change >= 0 ? 'text-green-600' : 'text-red-600')}>
              {change >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
              <span className="text-xs font-medium">{formatPercent(change)}</span>
            </div>
          )}
        </div>
        <div className={cn('p-2.5 rounded-lg', iconBgColor)}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

// ── Link Item Component ───────────────────────────────────────────────────────

interface LinkItemProps {
  link: LinkClickData;
  index: number;
}

function LinkItem({ link, index }: LinkItemProps) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-b-0">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{link.linkLabel}</p>
        <p className="text-xs text-gray-500 capitalize">{link.linkType}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{formatNumber(link.clickCount)}</p>
        <p className="text-xs text-gray-500">clicks</p>
      </div>
    </div>
  );
}

// ── Main Dashboard Component ───────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const params = useParams();
  const storeSlug = params.storeSlug as string;
  const t = useTranslations('analytics');

  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalViews: 0,
    totalLinkClicks: 0,
    totalQRCScans: 0,
    totalDownloads: 0,
  });
  const [viewsData, setViewsData] = useState<TimeSeriesData[]>([]);
  const [clicksData, setClicksData] = useState<TimeSeriesData[]>([]);
  const [popularLinks, setPopularLinks] = useState<LinkClickData[]>([]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [analytics, views, clicks, links] = await Promise.all([
        getStoreAnalytics(storeSlug, period),
        getTimeSeriesData(storeSlug, 'views', period),
        getTimeSeriesData(storeSlug, 'clicks', period),
        getPopularLinks(storeSlug, 10, period),
      ]);

      if (analytics) {
        setStats({
          totalViews: analytics.summary.totalViews,
          totalLinkClicks: analytics.summary.totalLinkClicks,
          totalQRCScans: analytics.summary.totalQRCScans,
          totalDownloads: analytics.summary.totalDownloads,
        });
      }

      setViewsData(views);
      setClicksData(clicks);
      setPopularLinks(links);
    } catch (error) {
      logger.error('Failed to fetch analytics:', { error });
    } finally {
      setLoading(false);
    }
  }, [storeSlug, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Analytics</h1>
              <p className="text-sm text-gray-500">Track your store performance</p>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
                className="text-sm font-medium text-gray-700 bg-transparent border-none focus:outline-2 focus:outline-indigo-400 focus:ring-2 focus:ring-indigo-400 rounded cursor-pointer"
                aria-label="Select time period for analytics"
              >
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="90d">90 days</option>
                <option value="365d">1 year</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {loading ? (
          // Loading skeleton
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-8 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="h-40 bg-gray-200 rounded" />
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title="Total Views"
                value={stats.totalViews}
                icon={<ViewsIcon />}
                change={12.5}
              />
              <StatCard
                title="Link Clicks"
                value={stats.totalLinkClicks}
                icon={<ClickIcon />}
                iconBgColor="bg-green-50"
                iconColor="text-green-600"
                change={8.3}
              />
              <StatCard
                title="QR Scans"
                value={stats.totalQRCScans}
                icon={<ScanIcon />}
                iconBgColor="bg-purple-50"
                iconColor="text-purple-600"
              />
              <StatCard
                title="Downloads"
                value={stats.totalDownloads}
                icon={<DownloadIcon />}
                iconBgColor="bg-orange-50"
                iconColor="text-orange-600"
              />
            </div>

            {/* Views Chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Views Over Time</h3>
              <SimpleChart data={viewsData} color="#4F46E5" />
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{formatDate(viewsData[0]?.date || new Date().toISOString())}</span>
                <span>{formatDate(viewsData[viewsData.length - 1]?.date || new Date().toISOString())}</span>
              </div>
            </div>

            {/* Clicks Chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Link Clicks Over Time</h3>
              <SimpleChart data={clicksData} color="#10B981" />
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{formatDate(clicksData[0]?.date || new Date().toISOString())}</span>
                <span>{formatDate(clicksData[clicksData.length - 1]?.date || new Date().toISOString())}</span>
              </div>
            </div>

            {/* Popular Links */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Popular Links</h3>
                <LinkIcon className="w-5 h-5 text-gray-400" />
              </div>
              {popularLinks.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {popularLinks.map((link, index) => (
                    <LinkItem key={link.linkId} link={link} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No link clicks yet</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

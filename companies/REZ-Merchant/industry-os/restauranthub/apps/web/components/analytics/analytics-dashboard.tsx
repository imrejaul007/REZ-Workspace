'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  BarChart3,
  Activity,
  Target,
  RefreshCw,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { BenchmarkCard } from './benchmark-card';
import { GapAlert } from './gap-alert';
import type { OperationalGap } from './gap-alert';

// ── Types mirroring analytics.dto.ts ─────────────────────────────────────────

interface BenchmarkPoint {
  value: number;
  peerAvg: number;
  percentile: number;
}

interface BenchmarkData {
  merchantId: string;
  peerGroup: {
    city: string;
    cuisineType: string;
    sizeCategory: string;
    merchantCount: number;
  };
  foodCostPct: BenchmarkPoint;
  avgOrderValue: BenchmarkPoint;
  staffCostPct: BenchmarkPoint;
  monthlyRevenue: BenchmarkPoint;
  repeatCustomerRate: BenchmarkPoint;
  computedAt: string;
}

interface OwnMetrics {
  merchantId: string;
  period: string;
  totalRevenue: number;
  totalTransactions: number;
  uniqueCustomers: number;
  averageTransactionValue: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueGrowthPercent: number;
  foodCostPercentage: number;
  wastePercentage: number;
  topProducts: Array<{ productId: string; productName: string; revenue: number; quantity: number }>;
  revenueByDay: Array<{ date: string; revenue: number; transactions: number }>;
}

interface AnalyticsDashboard {
  ownMetrics: OwnMetrics;
  benchmarks: BenchmarkData | null;
  insufficientPeerData: boolean;
  gaps: OperationalGap[];
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AnalyticsDashboardProps {
  userRole: 'admin' | 'restaurant' | 'vendor' | 'employee';
  timeRange: '7d' | '30d' | '3m' | '1y';
  onTimeRangeChange: (range: '7d' | '30d' | '3m' | '1y') => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard({
  userRole,
  timeRange,
  onTimeRangeChange,
}: AnalyticsDashboardProps) {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '3m', label: '3 Months' },
    { value: '1y', label: '1 Year' },
  ] as const;

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<AnalyticsDashboard>('/analytics/dashboard');
      setDashboard(response.data);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const m = dashboard?.ownMetrics;
  const bm = dashboard?.benchmarks;
  const gaps = dashboard?.gaps ?? [];

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">Failed to load analytics</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <Button variant="outline" onClick={fetchDashboard} className="ml-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Restaurant performance with peer benchmarks
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {timeRangeOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={timeRange === opt.value ? 'default' : 'outline'}
                onClick={() => onTimeRangeChange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <Button variant="outline" onClick={fetchDashboard} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Operational gap alerts */}
      {gaps.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GapAlert gaps={gaps} />
        </motion.div>
      )}

      {/* Insufficient peer data notice */}
      {dashboard?.insufficientPeerData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800">
              Not enough peer data yet for your city/cuisine — we need 10+ restaurants before
              benchmark comparisons are shown.
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Monthly Revenue',
            value: m ? formatINR(m.currentMonthRevenue) : '—',
            change: m?.revenueGrowthPercent ?? 0,
            icon: DollarSign,
            color: 'text-green-600',
          },
          {
            title: 'Total Transactions',
            value: m?.totalTransactions.toLocaleString('en-IN') ?? '—',
            change: 0,
            icon: ShoppingCart,
            color: 'text-blue-600',
          },
          {
            title: 'Unique Customers',
            value: m?.uniqueCustomers.toLocaleString('en-IN') ?? '—',
            change: 0,
            icon: Users,
            color: 'text-purple-600',
          },
          {
            title: 'Avg Order Value',
            value: m ? formatINR(m.averageTransactionValue) : '—',
            change: 0,
            icon: Target,
            color: 'text-orange-600',
          },
        ].map((metric, i) => {
          const Icon = metric.icon;
          const up = metric.change >= 0;
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                      <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                      {metric.change !== 0 && (
                        <div
                          className={cn(
                            'flex items-center gap-1 text-sm',
                            up ? 'text-green-600' : 'text-red-600',
                          )}
                        >
                          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          <span>{Math.abs(metric.change).toFixed(1)}% vs last month</span>
                        </div>
                      )}
                    </div>
                    <div className={cn('p-3 rounded-full bg-muted', metric.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Peer benchmark cards */}
      {bm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Peer Benchmarks
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {bm.peerGroup.city} · {bm.peerGroup.cuisineType} · {bm.peerGroup.merchantCount} restaurants
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                How you compare to similar restaurants in your city and cuisine segment.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <BenchmarkCard
                  metric="Food Cost %"
                  yourValue={bm.foodCostPct.value}
                  peerAvg={bm.foodCostPct.peerAvg}
                  percentile={bm.foodCostPct.percentile}
                  unit="%"
                  trainingSlug="food-cost-engineering"
                />
                <BenchmarkCard
                  metric="Avg Order Value"
                  yourValue={bm.avgOrderValue.value}
                  peerAvg={bm.avgOrderValue.peerAvg}
                  percentile={bm.avgOrderValue.percentile}
                  unit="₹"
                  trainingSlug="upsell-techniques"
                />
                <BenchmarkCard
                  metric="Staff Cost %"
                  yourValue={bm.staffCostPct.value}
                  peerAvg={bm.staffCostPct.peerAvg}
                  percentile={bm.staffCostPct.percentile}
                  unit="%"
                  trainingSlug="team-retention"
                />
                <BenchmarkCard
                  metric="Monthly Revenue"
                  yourValue={bm.monthlyRevenue.value}
                  peerAvg={bm.monthlyRevenue.peerAvg}
                  percentile={bm.monthlyRevenue.percentile}
                  unit="₹"
                  trainingSlug="revenue-growth-fundamentals"
                />
                <BenchmarkCard
                  metric="Repeat Customer Rate %"
                  yourValue={bm.repeatCustomerRate.value}
                  peerAvg={bm.repeatCustomerRate.peerAvg}
                  percentile={bm.repeatCustomerRate.percentile}
                  unit="%"
                  trainingSlug="customer-loyalty-playbook"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Revenue trend */}
      {m && m.revenueByDay.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-1">
                {m.revenueByDay.slice(-30).map((day, i) => {
                  const max = Math.max(...m.revenueByDay.map((d) => d.revenue));
                  const heightPct = max > 0 ? (day.revenue / max) * 100 : 0;
                  return (
                    <div
                      key={day.date}
                      className="flex-1 bg-primary/80 rounded-t hover:bg-primary transition-colors cursor-default min-w-0"
                      style={{ height: `${Math.max(2, heightPct)}%` }}
                      title={`${day.date}: ${formatINR(day.revenue)}`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Daily revenue — last {Math.min(30, m.revenueByDay.length)} days
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top products */}
      {m && m.topProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Top Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {m.topProducts.slice(0, 5).map((product, i) => (
                  <div key={product.productId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{product.productName}</p>
                        <p className="text-xs text-muted-foreground">{product.quantity} units sold</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">{formatINR(product.revenue)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Download,
  RefreshCw,
  Target,
  Award,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { apiClient } from '@/lib/api/client';
import { BenchmarkCard } from '@/components/analytics/benchmark-card';
import { GapAlert } from '@/components/analytics/gap-alert';
import type { OperationalGap } from '@/components/analytics/gap-alert';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BenchmarkPoint {
  value: number;
  peerAvg: number;
  percentile: number;
}

interface BenchmarkData {
  peerGroup: { city: string; cuisineType: string; merchantCount: number; sizeCategory: string };
  foodCostPct: BenchmarkPoint;
  avgOrderValue: BenchmarkPoint;
  staffCostPct: BenchmarkPoint;
  monthlyRevenue: BenchmarkPoint;
  repeatCustomerRate: BenchmarkPoint;
  computedAt: string;
}

interface AnalyticsDashboard {
  ownMetrics: {
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
  };
  benchmarks: BenchmarkData | null;
  insufficientPeerData: boolean;
  gaps: OperationalGap[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function changeColor(v: number) {
  return v >= 0 ? 'text-green-600' : 'text-red-600';
}

function ChangeIcon({ v }: { v: number }) {
  return v >= 0
    ? <TrendingUp className="h-4 w-4 text-green-600" />
    : <TrendingDown className="h-4 w-4 text-red-600" />;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AnalyticsDashboardPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<AnalyticsDashboard>('/analytics/dashboard');
      setDashboard(res.data);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load dashboard data');
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

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-56 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-6"><div className="h-20 bg-muted animate-pulse rounded" /></CardContent></Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">Failed to load dashboard</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <Button variant="outline" onClick={fetchDashboard} className="ml-auto">
                <RefreshCw className="h-4 w-4 mr-2" /> Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your business performance and peer benchmarks</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchDashboard}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Gap alerts */}
        {gaps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GapAlert gaps={gaps} />
          </motion.div>
        )}

        {/* Peer data insufficient notice */}
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: 'Total Revenue',
              value: m ? formatINR(m.currentMonthRevenue) : '—',
              change: m?.revenueGrowthPercent ?? 0,
              icon: DollarSign,
              iconColor: 'text-green-500',
            },
            {
              label: 'Total Transactions',
              value: m?.totalTransactions.toLocaleString('en-IN') ?? '—',
              change: 0,
              icon: ShoppingCart,
              iconColor: 'text-blue-500',
            },
            {
              label: 'Unique Customers',
              value: m?.uniqueCustomers.toLocaleString('en-IN') ?? '—',
              change: 0,
              icon: Users,
              iconColor: 'text-purple-500',
            },
            {
              label: 'Avg Order Value',
              value: m ? formatINR(m.averageTransactionValue) : '—',
              change: 0,
              icon: Target,
              iconColor: 'text-orange-500',
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{card.label}</p>
                        <h3 className="text-2xl font-bold mt-2">{card.value}</h3>
                        {card.change !== 0 && (
                          <div className="flex items-center mt-2">
                            <ChangeIcon v={card.change} />
                            <span className={`text-sm ml-1 ${changeColor(card.change)}`}>
                              {Math.abs(card.change).toFixed(1)}% vs last period
                            </span>
                          </div>
                        )}
                      </div>
                      <Icon className={`h-8 w-8 ${card.iconColor}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Benchmark cards */}
        {bm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Peer Benchmarks
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {bm.peerGroup.city} · {bm.peerGroup.cuisineType} · {bm.peerGroup.merchantCount} peers
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  <BenchmarkCard metric="Food Cost %" yourValue={bm.foodCostPct.value} peerAvg={bm.foodCostPct.peerAvg} percentile={bm.foodCostPct.percentile} unit="%" trainingSlug="food-cost-engineering" />
                  <BenchmarkCard metric="Avg Order Value" yourValue={bm.avgOrderValue.value} peerAvg={bm.avgOrderValue.peerAvg} percentile={bm.avgOrderValue.percentile} unit="₹" trainingSlug="upsell-techniques" />
                  <BenchmarkCard metric="Staff Cost %" yourValue={bm.staffCostPct.value} peerAvg={bm.staffCostPct.peerAvg} percentile={bm.staffCostPct.percentile} unit="%" trainingSlug="team-retention" />
                  <BenchmarkCard metric="Monthly Revenue" yourValue={bm.monthlyRevenue.value} peerAvg={bm.monthlyRevenue.peerAvg} percentile={bm.monthlyRevenue.percentile} unit="₹" trainingSlug="revenue-growth-fundamentals" />
                  <BenchmarkCard metric="Repeat Customer Rate %" yourValue={bm.repeatCustomerRate.value} peerAvg={bm.repeatCustomerRate.peerAvg} percentile={bm.repeatCustomerRate.percentile} unit="%" trainingSlug="customer-loyalty-playbook" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Revenue chart */}
        {m && m.revenueByDay.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {m.revenueByDay.slice(-30).map((day) => {
                    const max = Math.max(...m.revenueByDay.map((d) => d.revenue));
                    const h = max > 0 ? (day.revenue / max) * 200 : 2;
                    return (
                      <div
                        key={day.date}
                        className="bg-blue-500 rounded-t min-w-2 flex-1 transition-all hover:bg-blue-600 cursor-default"
                        style={{ height: `${Math.max(2, h)}px` }}
                        title={`${day.date}: ${formatINR(day.revenue)}`}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Top products */}
        {m && m.topProducts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" /> Top Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {m.topProducts.slice(0, 5).map((p, i) => (
                    <div key={p.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{p.productName}</p>
                          <p className="text-xs text-muted-foreground">{p.quantity} units</p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm">{formatINR(p.revenue)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  Download,
  BarChart3,
  MapPin,
  Calendar,
  ArrowUp,
  ArrowDown,
  Filter,
  Search,
  Briefcase,
  UserCheck,
  Target,
  AlertCircle,
  RefreshCw,
  WrenchScrewdriver
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// ── Types matching the analytics.dto ──────────────────────────────────────────

interface KpiRecord {
  metricName: string;
  value: number;
  peerAvg?: number;
  period?: string;
}

interface PeerBenchmark {
  metricName: string;
  merchantValue: number;
  peerAvg: number;
  delta: number;
}

interface AnalyticsDashboard {
  rezMerchantId: string;
  kpis?: KpiRecord[];
  benchmarks?: PeerBenchmark[];
  // Additional fields that may come from the API
  totalOrders?: number;
  totalRevenue?: number;
  avgOrderValue?: number;
  repeatCustomerRate?: number;
  [key: string]: unknown;
}

interface OperationalGap {
  metricName: string;
  merchantValue: number;
  peerAvg: number;
  gapPercent: number;
  trainingModuleSlug: string;
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; dashboard: AnalyticsDashboard; gaps: OperationalGap[] }
  | { status: 'unavailable'; reason: string }
  | { status: 'error'; message: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.message || `Request failed: ${res.status}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  format = 'number',
  subtitle,
}: {
  title: string;
  value: number;
  change?: number;
  icon: React.ElementType;
  format?: 'number' | 'percentage';
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center space-x-2">
              <h3 className="text-2xl font-bold">
                {format === 'percentage'
                  ? `${Number(value).toFixed(1)}%`
                  : Number(value).toLocaleString()}
              </h3>
              {change !== undefined && (
                <Badge
                  variant={change >= 0 ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {change >= 0
                    ? <ArrowUp className="h-3 w-3 mr-1 inline" />
                    : <ArrowDown className="h-3 w-3 mr-1 inline" />}
                  {Math.abs(change).toFixed(1)}%
                </Badge>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComingSoonBanner({ reason }: { reason: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 space-y-6 text-center"
    >
      <div className="p-5 bg-primary/10 rounded-full">
        <BarChart3 className="h-14 w-14 text-primary" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold">Analytics Coming Soon</h2>
        <p className="text-muted-foreground">
          {reason}
        </p>
        <p className="text-sm text-muted-foreground">
          Full analytics — KPIs, peer benchmarks, hiring funnels, and operational gaps — will be
          available once your restaurant is connected to the REZ merchant platform.
        </p>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function JobAnalyticsPage() {
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' });

  const load = useCallback(async () => {
    setFetchState({ status: 'loading' });
    try {
      const [dashboard, gaps] = await Promise.all([
        apiFetch<AnalyticsDashboard>('/analytics/dashboard'),
        apiFetch<OperationalGap[]>('/analytics/gaps'),
      ]);
      setFetchState({ status: 'success', dashboard, gaps });
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      // 401 / 403 — the analytics endpoint uses a different auth strategy
      // (REZ_MERCHANT_STRATEGY). Regular restaurant JWT sessions will get a 401.
      if (e.status === 401 || e.status === 403) {
        setFetchState({
          status: 'unavailable',
          reason:
            'Your account is not yet linked to the REZ merchant analytics platform. ' +
            'Please complete the REZ merchant onboarding to unlock full analytics.',
        });
      } else {
        setFetchState({ status: 'error', message: e.message || 'Failed to load analytics' });
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Render states ──────────────────────────────────────────────────────────

  if (fetchState.status === 'idle' || fetchState.status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading analytics...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (fetchState.status === 'unavailable') {
    return (
      <DashboardLayout>
        <ComingSoonBanner reason={fetchState.reason} />
      </DashboardLayout>
    );
  }

  if (fetchState.status === 'error') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h3 className="text-lg font-semibold">Failed to load analytics</h3>
          <p className="text-muted-foreground max-w-sm">{fetchState.message}</p>
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────

  const { dashboard, gaps } = fetchState;
  const kpis = dashboard.kpis ?? [];
  const benchmarks = dashboard.benchmarks ?? [];

  // Extract numeric KPI values for the metric cards, falling back to whatever
  // top-level numbers the API returned.
  const getKpi = (name: string, fallback = 0): number => {
    const found = kpis.find(k => k.metricName === name);
    if (found) return found.value;
    return (dashboard[name] as number) ?? fallback;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Your restaurant KPIs and peer benchmarks
            </p>
          </div>
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* KPI Overview — show unknown KPIs the API returned */}
        {kpis.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => (
              <motion.div
                key={kpi.metricName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MetricCard
                  title={kpi.metricName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  value={kpi.value}
                  icon={TrendingUp}
                  subtitle={kpi.period ?? undefined}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Benchmarks vs peers */}
        {benchmarks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Peer Benchmarks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {benchmarks.map(b => {
                  const isPositive = b.delta >= 0;
                  const percentage = b.peerAvg > 0
                    ? Math.min(100, (b.merchantValue / b.peerAvg) * 100)
                    : 0;
                  return (
                    <div key={b.metricName} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {b.metricName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <div className="flex items-center space-x-3">
                          <span className="text-muted-foreground">
                            You: {b.merchantValue.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">
                            Peers: {b.peerAvg.toLocaleString()}
                          </span>
                          <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
                            {isPositive ? <ArrowUp className="h-3 w-3 mr-1 inline" /> : <ArrowDown className="h-3 w-3 mr-1 inline" />}
                            {Math.abs(b.delta).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Operational Gaps */}
        {gaps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
                Top Operational Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gaps.map(gap => (
                  <div
                    key={gap.metricName}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">
                        {gap.metricName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        You: {gap.merchantValue.toLocaleString()} &nbsp;|&nbsp;
                        Peers avg: {gap.peerAvg.toLocaleString()} &nbsp;|&nbsp;
                        Gap: {gap.gapPercent.toFixed(1)}%
                      </p>
                    </div>
                    {gap.trainingModuleSlug && (
                      <Badge variant="outline" className="text-xs whitespace-nowrap ml-4">
                        Training: {gap.trainingModuleSlug}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state when API returned data but no KPIs/benchmarks/gaps yet */}
        {kpis.length === 0 && benchmarks.length === 0 && gaps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No analytics data yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Your dashboard is connected but there is not enough activity to generate metrics.
              Check back after more orders and job activity.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

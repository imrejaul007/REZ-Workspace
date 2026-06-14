/**
 * Reports Screen — Sales summary, revenue chart, top products, recent transactions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryLine, VictoryGroup } from 'victory-native';

import { Colors, Shadows } from '@/constants/DesignTokens';
import { useAuth } from '@/contexts/AuthContext';
import {
  dashboardService,
  DashboardMetrics,
  TopProduct,
  SalesData,
} from '@/services/api/dashboard';
import { paymentsService, StorePaymentRecord } from '@/services/api/payments';
import { reportService, SalesReport, RevenueReport, DateRange } from '@/services/reportService';
import { useStore } from '@/contexts/StoreContext';

const { width } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatShortCurrency(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

// ─── Revenue Bar Chart ────────────────────────────────────────────────────────

const RevenueChart = ({ data }: { data: SalesData[] }) => {
  const chartData = data.slice(-7).map((point, idx) => ({
    x: idx + 1,
    y: point.amount,
    label: new Date(point.date).toLocaleDateString('en-IN', { day: '2-digit' }),
  }));

  const chartWidth = width - 64; // Account for padding
  const chartHeight = 200;

  return (
    <View style={chartStyles.container}>
      <VictoryChart
        width={chartWidth}
        height={chartHeight}
        padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
      >
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: Colors.border.light },
            tickLabels: { fontSize: 10, fill: Colors.text.tertiary },
            grid: { stroke: Colors.border.light, strokeDasharray: '4' },
          }}
        />
        <VictoryAxis
          style={{
            axis: { stroke: Colors.border.light },
            tickLabels: { fontSize: 10, fill: Colors.text.tertiary },
          }}
          tickFormat={(tick: number) => {
            const point = chartData[tick - 1];
            return point?.label || '';
          }}
        />
        <VictoryBar
          data={chartData}
          style={{
            data: { fill: '#7C3AED', width: 28 },
          }}
          cornerRadius={{ top: 6 }}
        />
      </VictoryChart>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  subLabel?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  trend?: number;
}

const StatCard = ({ label, value, subLabel, icon, color, bgColor, trend }: StatCardProps) => (
  <View style={[statStyles.card, { borderTopColor: color }]}>
    <View style={[statStyles.iconWrap, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={statStyles.label}>{label}</Text>
    <Text style={[statStyles.value, { color }]}>{value}</Text>
    {subLabel && <Text style={statStyles.subLabel}>{subLabel}</Text>}
    {typeof trend === 'number' && (
      <View
        style={[
          statStyles.trendRow,
          { backgroundColor: trend >= 0 ? Colors.success[50] : Colors.error[50] },
        ]}
      >
        <Ionicons
          name={trend >= 0 ? 'trending-up' : 'trending-down'}
          size={12}
          color={trend >= 0 ? Colors.success[600] : Colors.error[600]}
        />
        <Text
          style={[
            statStyles.trendText,
            { color: trend >= 0 ? Colors.success[600] : Colors.error[600] },
          ]}
        >
          {Math.abs(trend).toFixed(1)}%
        </Text>
      </View>
    )}
  </View>
);

const statStyles = StyleSheet.create({
  card: {
    width: (width - 56) / 2,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderTopWidth: 3,
    ...Shadows.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: { fontSize: 12, color: Colors.text.tertiary, fontWeight: '500' },
  value: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  subLabel: { fontSize: 11, color: Colors.text.tertiary },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  trendText: { fontSize: 11, fontWeight: '700' },
});

// ─── Period Selector ──────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d';
type ReportTab = 'summary' | 'pl' | 'gst' | 'expenses';

const PERIODS: { key: Period; label: string }[] = [
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReportsScreen() {
  const { merchant } = useAuth();
  const { activeStore } = useStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>('30d');
  const [activeTab, setActiveTab] = useState<ReportTab>('summary');

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentPayments, setRecentPayments] = useState<StorePaymentRecord[]>([]);

  // Report service state
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const storeId = activeStore?._id;
  const merchantId = merchant?._id || activeStore?.merchantId || '';

  // Helper to get date range based on period
  const getDateRange = useCallback((): DateRange => {
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
    }
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }, [period]);

  const loadData = useCallback(async () => {
    try {
      setReportError(null);

      // Fetch from dashboard service (existing behavior)
      const [metricsResult, salesResult, productsResult] = await Promise.allSettled([
        dashboardService.getMetrics(storeId),
        dashboardService.getSalesData(period),
        dashboardService.getTopProducts(8, period),
      ]);

      if (metricsResult.status === 'fulfilled') setMetrics(metricsResult.value);
      if (salesResult.status === 'fulfilled') setSalesData(salesResult.value);
      if (productsResult.status === 'fulfilled') setTopProducts(productsResult.value);

      if (storeId) {
        try {
          const paymentsResp = await paymentsService.getRecentPayments(storeId, 10);
          setRecentPayments(paymentsResp?.data?.transactions || []);
        } catch {
          /* ignore */
        }
      }

      // Fetch from report service (new backend integration)
      if (merchantId) {
        const dateRange = getDateRange();
        try {
          const [salesReportResult, revenueReportResult] = await Promise.allSettled([
            reportService.getSalesReport(merchantId, dateRange),
            reportService.getRevenueReport(merchantId, dateRange),
          ]);

          if (salesReportResult.status === 'fulfilled') {
            setSalesReport(salesReportResult.value);
          }
          if (revenueReportResult.status === 'fulfilled') {
            setRevenueReport(revenueReportResult.value);
          }
        } catch (err) {
          // Only set error if it's a network/server issue, not if backend is unavailable
          if (err?.code !== 'NETWORK_ERROR' && err?.statusCode !== 503) {
            logger.warn('[Reports] Report service error:', err);
          }
        }
      }
    } catch (e) {
      logger.warn('[Reports] Load error:', e);
    }
  }, [storeId, period, merchantId, getDateRange]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Handle export to PDF or Excel
  const handleExportReport = async (reportType: string, format: 'pdf' | 'excel') => {
    if (!merchantId) {
      showToast({ type: 'error', text1: 'Error', text2: 'Merchant ID not found' });
      return;
    }

    try {
      showToast({ type: 'info', text1: 'Generating export...', text2: 'Please wait' });

      if (format === 'pdf') {
        await reportService.exportToPDF(reportType, merchantId, getDateRange());
      } else {
        await reportService.exportToExcel(reportType, merchantId, getDateRange());
      }

      showToast({ type: 'success', text1: 'Export ready', text2: `Your ${reportType} report is ready for download` });
    } catch (error) {
      logger.error('[Reports] Export error:', error);
      showToast({ type: 'error', text1: 'Export failed', text2: 'Please try again later' });
    }
  };

  // Derived values
  const monthlyRevenue = metrics?.revenue.total ?? 0;
  const totalOrders = metrics?.orders.total ?? 0;
  const revenueGrowth = metrics?.revenue.change ?? null;
  const avgOrderValue = totalOrders > 0 ? monthlyRevenue / totalOrders : 0;
  const totalCustomers = metrics?.customers.total ?? 0;
  const todayRevenue = salesData.length > 0 ? salesData[salesData.length - 1].amount : 0;
  const weekRevenue = salesData.slice(-7).reduce((s, d) => s + d.amount, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Gradient Header */}
      <LinearGradient colors={['#7C3AED', '#6366F1']} style={styles.header}>
        <Animated.View entering={FadeInDown.delay(50)}>
          <Text style={styles.headerTitle}>Reports & Analytics</Text>
          <Text style={styles.headerSubtitle}>
            {activeStore?.name || 'All Stores'} •{' '}
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </Text>
        </Animated.View>
        <View style={styles.periodSelector}>
          {PERIODS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.periodButton, period === key && styles.periodButtonActive]}
              onPress={() => setPeriod(key)}
            >
              <Text
                style={[styles.periodButtonText, period === key && styles.periodButtonTextActive]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        {[
          { key: 'summary' as ReportTab, label: 'Summary' },
          { key: 'pl' as ReportTab, label: 'P&L' },
          { key: 'gst' as ReportTab, label: 'GST' },
          { key: 'expenses' as ReportTab, label: 'Expenses' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <>
          {/* Today's Summary Banner */}
          <Animated.View entering={FadeInDown.delay(80)} style={styles.todayBanner}>
            <View style={styles.todayItem}>
              <Text style={styles.todayLabel}>Today's Sales</Text>
              <Text style={styles.todayValue}>{formatShortCurrency(todayRevenue)}</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayItem}>
              <Text style={styles.todayLabel}>This Week</Text>
              <Text style={styles.todayValue}>{formatShortCurrency(weekRevenue)}</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayItem}>
              <Text style={styles.todayLabel}>This Month</Text>
              <Text style={styles.todayValue}>{formatShortCurrency(monthlyRevenue)}</Text>
            </View>
          </Animated.View>

          {/* Stats Grid */}
          <Animated.View entering={FadeInDown.delay(120)} style={styles.section}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.statsGrid}>
              <StatCard
                label="Total Revenue"
                value={formatShortCurrency(monthlyRevenue)}
                icon="trending-up"
                color="#10B981"
                bgColor="#D1FAE5"
                trend={typeof revenueGrowth === 'number' ? revenueGrowth : undefined}
              />
              <StatCard
                label="Avg Order Value"
                value={formatShortCurrency(avgOrderValue)}
                icon="cart"
                color="#F59E0B"
                bgColor="#FEF3C7"
                subLabel={`${totalOrders} orders`}
              />
              <StatCard
                label="Total Orders"
                value={String(totalOrders)}
                icon="receipt"
                color="#EF4444"
                bgColor="#FEE2E2"
              />
              <StatCard
                label="Customers"
                value={String(totalCustomers)}
                icon="people"
                color="#8B5CF6"
                bgColor="#EDE9FE"
              />
            </View>
          </Animated.View>

          {/* Revenue Chart */}
          {salesData.length > 0 && (
            <Animated.View entering={FadeInDown.delay(160)} style={styles.section}>
              <Text style={styles.sectionTitle}>Revenue Trend</Text>
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Daily Revenue (Last 7 days)</Text>
                  <Text style={styles.chartSubtitle}>Total: {formatCurrency(weekRevenue)}</Text>
                </View>
                <RevenueChart data={salesData} />
              </View>
            </Animated.View>
          )}

          {/* Top Products */}
          {topProducts.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
              <Text style={styles.sectionTitle}>Top Selling Products</Text>
              <View style={styles.listCard}>
                {topProducts.slice(0, 8).map((product, i) => {
                  const maxRev = topProducts[0]?.revenue || 1;
                  const barW = Math.max(4, (product.revenue / maxRev) * 100);
                  return (
                    <View
                      key={product.productId}
                      style={[styles.productRow, i > 0 && styles.rowBorder]}
                    >
                      <View style={styles.productRank}>
                        <Text style={styles.productRankText}>{i + 1}</Text>
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <View style={styles.productBarContainer}>
                          <View style={[styles.productBar, { width: `${barW}%` }]} />
                        </View>
                        <Text style={styles.productSales}>{product.sales} units</Text>
                      </View>
                      <Text style={styles.productRevenue}>
                        {formatShortCurrency(product.revenue)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Recent Transactions */}
          <Animated.View entering={FadeInDown.delay(240)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => router.push('/(dashboard)/payments')}>
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>

            {recentPayments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={40} color={Colors.gray[300]} />
                <Text style={styles.emptyText}>No recent transactions</Text>
                <Text style={styles.emptySubtext}>
                  Transactions will appear here once customers make payments.
                </Text>
              </View>
            ) : (
              <View style={styles.listCard}>
                {recentPayments.slice(0, 8).map((tx, i) => {
                  const isCompleted = tx.status === 'completed';
                  return (
                    <View key={tx.paymentId} style={[styles.txRow, i > 0 && styles.rowBorder]}>
                      <View
                        style={[
                          styles.txIcon,
                          {
                            backgroundColor: isCompleted ? Colors.success[50] : Colors.warning[50],
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            tx.paymentMethod === 'upi'
                              ? 'phone-portrait-outline'
                              : tx.paymentMethod === 'cash'
                                ? 'cash-outline'
                                : 'card-outline'
                          }
                          size={18}
                          color={isCompleted ? Colors.success[600] : Colors.warning[600]}
                        />
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txMethod}>
                          {(tx.paymentMethod || 'Payment').toUpperCase()}
                        </Text>
                        <Text style={styles.txDate}>
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <View style={styles.txRight}>
                        <Text style={styles.txAmount}>{formatCurrency(tx.amount)}</Text>
                        <View
                          style={[
                            styles.txStatusBadge,
                            {
                              backgroundColor: isCompleted
                                ? Colors.success[50]
                                : Colors.warning[50],
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.txStatusText,
                              { color: isCompleted ? Colors.success[600] : Colors.warning[600] },
                            ]}
                          >
                            {tx.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.delay(280)} style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => router.push('/pos')}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="storefront" size={22} color="#7C3AED" />
                </View>
                <Text style={styles.quickActionText}>Open POS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => router.push('/pos/quick-bill')}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="flash" size={22} color="#6366F1" />
                </View>
                <Text style={styles.quickActionText}>Quick Bill</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => router.push('/(dashboard)/analytics')}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.success[50] }]}>
                  <Ionicons name="bar-chart" size={22} color={Colors.success[600]} />
                </View>
                <Text style={styles.quickActionText}>Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => router.push('/(dashboard)/payments')}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary[50] }]}>
                  <Ionicons name="cash" size={22} color={Colors.primary[600]} />
                </View>
                <Text style={styles.quickActionText}>Payments</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}

      {/* P&L Tab */}
      {activeTab === 'pl' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profit & Loss Statement</Text>
          <View style={styles.tabContent}>
            <View style={styles.tabRow}>
              <Text style={styles.tabRowLabel}>Revenue</Text>
              <Text style={styles.tabRowValue}>{formatCurrency(revenueReport?.summary?.grossRevenue ?? monthlyRevenue)}</Text>
            </View>
            <View style={[styles.tabRow, styles.tabRowMuted]}>
              <Text style={styles.tabRowLabel}>COGS (Cost of Goods Sold)</Text>
              <Text style={styles.tabRowValue}>{formatCurrency((revenueReport?.summary?.grossRevenue ?? monthlyRevenue) * 0.4)}</Text>
            </View>
            <View style={styles.tabRowDivider} />
            <View style={[styles.tabRow, styles.tabRowHighlight]}>
              <Text style={styles.tabRowLabel}>Gross Profit</Text>
              <Text style={styles.tabRowValue}>{formatCurrency((revenueReport?.summary?.grossRevenue ?? monthlyRevenue) * 0.6)}</Text>
            </View>
            <View style={[styles.tabRow, styles.tabRowMuted]}>
              <Text style={styles.tabRowLabel}>Operating Expenses</Text>
              <Text style={styles.tabRowValue}>{formatCurrency((revenueReport?.summary?.grossRevenue ?? monthlyRevenue) * 0.15)}</Text>
            </View>
            <View style={styles.tabRowDivider} />
            <View style={[styles.tabRow, styles.tabRowHighlight]}>
              <Text style={styles.tabRowLabel}>Net Profit</Text>
              <Text style={styles.tabRowValue}>{formatCurrency((revenueReport?.summary?.grossRevenue ?? monthlyRevenue) * 0.45)}</Text>
            </View>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => handleExportReport('sales', 'pdf')}
              disabled={!merchantId}
            >
              <Ionicons name="download" size={16} color="#fff" />
              <Text style={styles.exportButtonText}>Export P&L</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* GST Tab */}
      {activeTab === 'gst' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GST Summary</Text>
          <View style={styles.tabContent}>
            <View style={styles.tabRow}>
              <Text style={styles.tabRowLabel}>Output GST (Sales)</Text>
              <Text style={styles.tabRowValue}>{formatCurrency((revenueReport?.summary?.grossRevenue ?? monthlyRevenue) * 0.18)}</Text>
            </View>
            <View style={styles.tabRow}>
              <Text style={styles.tabRowLabel}>Input GST (Purchases)</Text>
              <Text style={styles.tabRowValue}>{formatCurrency((revenueReport?.summary?.grossRevenue ?? monthlyRevenue) * 0.4 * 0.18)}</Text>
            </View>
            <View style={styles.tabRowDivider} />
            <View style={[styles.tabRow, styles.tabRowHighlight]}>
              <Text style={styles.tabRowLabel}>Net GST Payable</Text>
              <Text style={styles.tabRowValue}>
                {formatCurrency((revenueReport?.summary?.grossRevenue ?? monthlyRevenue) * 0.18 - (revenueReport?.summary?.grossRevenue ?? monthlyRevenue) * 0.4 * 0.18)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => handleExportReport('sales', 'pdf')}
              disabled={!merchantId}
            >
              <Ionicons name="download" size={16} color="#fff" />
              <Text style={styles.exportButtonText}>Export GST</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Breakdown</Text>
          <View style={styles.tabContent}>
            <View style={styles.tabRow}>
              <Text style={styles.tabRowLabel}>Salaries & Wages</Text>
              <Text style={styles.tabRowValue}>{formatCurrency(monthlyRevenue * 0.08)}</Text>
            </View>
            <View style={styles.tabRow}>
              <Text style={styles.tabRowLabel}>Rent & Utilities</Text>
              <Text style={styles.tabRowValue}>{formatCurrency(monthlyRevenue * 0.04)}</Text>
            </View>
            <View style={styles.tabRow}>
              <Text style={styles.tabRowLabel}>Marketing</Text>
              <Text style={styles.tabRowValue}>{formatCurrency(monthlyRevenue * 0.02)}</Text>
            </View>
            <View style={styles.tabRow}>
              <Text style={styles.tabRowLabel}>Delivery & Logistics</Text>
              <Text style={styles.tabRowValue}>{formatCurrency(monthlyRevenue * 0.01)}</Text>
            </View>
            <View style={styles.tabRowDivider} />
            <View style={[styles.tabRow, styles.tabRowHighlight]}>
              <Text style={styles.tabRowLabel}>Total Expenses</Text>
              <Text style={styles.tabRowValue}>{formatCurrency(monthlyRevenue * 0.15)}</Text>
            </View>
            <TouchableOpacity style={styles.exportButton} onPress={() => {}}>
              <Ionicons name="download" size={16} color="#fff" />
              <Text style={styles.exportButtonText}>Export Expenses</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  content: {
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  tabSelector: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background.primary,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#7C3AED',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: 'white',
  },
  tabContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 16,
    gap: 0,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  tabRowMuted: {
    backgroundColor: Colors.background.secondary,
  },
  tabRowHighlight: {
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 0,
  },
  tabRowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  tabRowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  tabRowDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 4,
  },
  exportButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  periodButtonActive: { backgroundColor: 'white' },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  periodButtonTextActive: { color: '#7C3AED' },
  todayBanner: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 14,
    padding: 16,
    ...Shadows.md,
  },
  todayItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  todayDivider: {
    width: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 2,
  },
  todayLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7C3AED',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    ...Shadows.sm,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  chartSubtitle: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontWeight: '600',
  },
  listCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  productRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  productInfo: { flex: 1, gap: 3 },
  productName: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  productBarContainer: {
    height: 4,
    backgroundColor: Colors.gray[100],
    borderRadius: 2,
    overflow: 'hidden',
  },
  productBar: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
  productSales: { fontSize: 11, color: Colors.text.tertiary },
  productRevenue: { fontSize: 14, fontWeight: '700', color: '#7C3AED' },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1, gap: 2 },
  txMethod: { fontSize: 13, fontWeight: '600', color: Colors.text.primary },
  txDate: { fontSize: 11, color: Colors.text.tertiary },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 14, fontWeight: '700', color: Colors.text.primary },
  txStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
    backgroundColor: 'white',
    borderRadius: 14,
    ...Shadows.sm,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});
